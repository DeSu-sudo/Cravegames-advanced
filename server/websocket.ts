import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { storage } from "./storage";

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  username: string;
  currentRoom?: string;
}

const clients: Map<WebSocket, ConnectedClient> = new Map();
const roomClients: Map<string, Set<WebSocket>> = new Map();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleMessage(ws, message);
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      const client = clients.get(ws);
      if (client) {
        if (client.currentRoom) {
          leaveRoom(ws, client.currentRoom);
        }
        clients.delete(ws);
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  return wss;
}

async function handleMessage(ws: WebSocket, message: any) {
  switch (message.type) {
    case "auth":
      await handleAuth(ws, message);
      break;
    case "join_room":
      handleJoinRoom(ws, message.roomId);
      break;
    case "leave_room":
      handleLeaveRoom(ws, message.roomId);
      break;
    case "chat_message":
      await handleChatMessage(ws, message);
      break;
    case "private_message":
      await handlePrivateMessage(ws, message);
      break;
    case "typing":
      handleTyping(ws, message);
      break;
  }
}

async function handleAuth(ws: WebSocket, message: any) {
  const { userId, username } = message;
  if (!userId || !username) {
    ws.send(JSON.stringify({ type: "error", message: "Invalid auth data" }));
    return;
  }

  clients.set(ws, { ws, userId, username });
  ws.send(JSON.stringify({ type: "auth_success" }));
}

function handleJoinRoom(ws: WebSocket, roomId: string) {
  const client = clients.get(ws);
  if (!client) {
    ws.send(JSON.stringify({ type: "error", message: "Not authenticated" }));
    return;
  }

  if (client.currentRoom) {
    leaveRoom(ws, client.currentRoom);
  }

  client.currentRoom = roomId;
  
  if (!roomClients.has(roomId)) {
    roomClients.set(roomId, new Set());
  }
  roomClients.get(roomId)!.add(ws);

  broadcastToRoom(roomId, {
    type: "user_joined",
    userId: client.userId,
    username: client.username
  }, ws);

  ws.send(JSON.stringify({ type: "room_joined", roomId }));
}

function handleLeaveRoom(ws: WebSocket, roomId: string) {
  leaveRoom(ws, roomId);
  const client = clients.get(ws);
  if (client) {
    client.currentRoom = undefined;
  }
}

function leaveRoom(ws: WebSocket, roomId: string) {
  const client = clients.get(ws);
  const room = roomClients.get(roomId);
  
  if (room) {
    room.delete(ws);
    if (room.size === 0) {
      roomClients.delete(roomId);
    } else if (client) {
      broadcastToRoom(roomId, {
        type: "user_left",
        userId: client.userId,
        username: client.username
      });
    }
  }
}

async function handleChatMessage(ws: WebSocket, message: any) {
  const client = clients.get(ws);
  if (!client || !client.currentRoom) {
    ws.send(JSON.stringify({ type: "error", message: "Not in a room" }));
    return;
  }

  const { content } = message;
  if (!content || content.trim().length === 0) {
    return;
  }

  const blocked = await storage.isBlocked(client.userId, message.targetUserId || "");
  if (blocked) {
    return;
  }

  const chatMessage = await storage.addChatMessage({
    roomId: client.currentRoom,
    userId: client.userId,
    content: content.trim()
  });

  const user = await storage.getUser(client.userId);
  let avatarImageUrl: string | null = null;
  if (user?.activeAvatarId) {
    const avatarItem = await storage.getStoreItemById(user.activeAvatarId);
    avatarImageUrl = avatarItem?.imageUrl || null;
  }

  broadcastToRoom(client.currentRoom, {
    type: "chat_message",
    message: {
      ...chatMessage,
      username: client.username,
      avatarImageUrl
    }
  });
}

async function handlePrivateMessage(ws: WebSocket, message: any) {
  const client = clients.get(ws);
  if (!client) {
    ws.send(JSON.stringify({ type: "error", message: "Not authenticated" }));
    return;
  }

  const { conversationId, recipientId, content } = message;
  if (!content || content.trim().length === 0) {
    return;
  }

  const blocked = await storage.isBlocked(client.userId, recipientId);
  if (blocked) {
    ws.send(JSON.stringify({ type: "error", message: "Cannot message this user" }));
    return;
  }

  const privateMessage = await storage.addPrivateMessage({
    conversationId,
    senderId: client.userId,
    content: content.trim()
  });

  const user = await storage.getUser(client.userId);
  let avatarImageUrl: string | null = null;
  if (user?.activeAvatarId) {
    const avatarItem = await storage.getStoreItemById(user.activeAvatarId);
    avatarImageUrl = avatarItem?.imageUrl || null;
  }

  const messageData = {
    type: "private_message",
    message: {
      ...privateMessage,
      username: client.username,
      avatarImageUrl
    }
  };

  ws.send(JSON.stringify(messageData));

  for (const [clientWs, clientData] of clients) {
    if (clientData.userId === recipientId && clientWs !== ws) {
      clientWs.send(JSON.stringify(messageData));
    }
  }
}

function handleTyping(ws: WebSocket, message: any) {
  const client = clients.get(ws);
  if (!client) return;

  const { roomId, conversationId, recipientId } = message;

  if (roomId && client.currentRoom === roomId) {
    broadcastToRoom(roomId, {
      type: "typing",
      userId: client.userId,
      username: client.username
    }, ws);
  } else if (conversationId && recipientId) {
    for (const [clientWs, clientData] of clients) {
      if (clientData.userId === recipientId) {
        clientWs.send(JSON.stringify({
          type: "typing",
          userId: client.userId,
          username: client.username,
          conversationId
        }));
      }
    }
  }
}

function broadcastToRoom(roomId: string, data: any, excludeWs?: WebSocket) {
  const room = roomClients.get(roomId);
  if (!room) return;

  const message = JSON.stringify(data);
  for (const ws of room) {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

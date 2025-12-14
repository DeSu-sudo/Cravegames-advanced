import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Hash, MessageCircle, Send, Plus, ArrowLeft, Users } from "lucide-react";
import type { ChatRoom, ChatMessageWithUser, ConversationWithUser, PrivateMessageWithUser, UserWithAvatar } from "@shared/schema";

function useWebSocket(currentUser: UserWithAvatar | null | undefined) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messageHandlers = useRef<Map<string, (data: any) => void>>(new Map());
  const pendingMessages = useRef<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: "auth",
        userId: currentUser.id,
        username: currentUser.username
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "auth_success") {
        setIsConnected(true);
        pendingMessages.current.forEach((msg) => {
          socket.send(JSON.stringify(msg));
        });
        pendingMessages.current = [];
      }
      const handler = messageHandlers.current.get(data.type);
      if (handler) handler(data);
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [currentUser?.id]);

  const addHandler = useCallback((type: string, handler: (data: any) => void) => {
    messageHandlers.current.set(type, handler);
  }, []);

  const removeHandler = useCallback((type: string) => {
    messageHandlers.current.delete(type);
  }, []);

  const send = useCallback((data: any) => {
    if (ws && ws.readyState === WebSocket.OPEN && isConnected) {
      ws.send(JSON.stringify(data));
    } else {
      pendingMessages.current.push(data);
    }
  }, [ws, isConnected]);

  return { ws, isConnected, send, addHandler, removeHandler };
}

function RoomChat({ room, currentUser, onBack }: {
  room: ChatRoom;
  currentUser: UserWithAvatar;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessageWithUser[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { send, addHandler, removeHandler } = useWebSocket(currentUser);

  const { data: initialMessages, isLoading } = useQuery<ChatMessageWithUser[]>({
    queryKey: ["/api/chat-rooms", room.id, "messages"],
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    send({ type: "join_room", roomId: room.id });

    addHandler("chat_message", (data) => {
      setMessages((prev) => [...prev, data.message]);
    });

    return () => {
      send({ type: "leave_room", roomId: room.id });
      removeHandler("chat_message");
    };
  }, [room.id, send, addHandler, removeHandler]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    send({ type: "chat_message", content: newMessage.trim() });
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-3 border-b">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-rooms">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Hash className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="font-semibold" data-testid="text-room-name">{room.name}</h2>
          {room.description && (
            <p className="text-xs text-muted-foreground">{room.description}</p>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3" data-testid={`message-${msg.id}`}>
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={msg.avatarImageUrl || ""} alt={msg.username} />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {msg.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{msg.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm break-words">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No messages yet. Start the conversation!
          </p>
        )}
      </ScrollArea>

      <div className="p-3 border-t flex gap-2">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          data-testid="input-room-message"
        />
        <Button onClick={handleSend} data-testid="button-send-room-message">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function PrivateChat({ conversation, currentUser, onBack }: {
  conversation: ConversationWithUser;
  currentUser: UserWithAvatar;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<PrivateMessageWithUser[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { send, addHandler, removeHandler } = useWebSocket(currentUser);

  const recipientId = conversation.user1Id === currentUser.id
    ? conversation.user2Id
    : conversation.user1Id;

  const { data: initialMessages, isLoading } = useQuery<PrivateMessageWithUser[]>({
    queryKey: ["/api/conversations", conversation.id, "messages"],
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    addHandler("private_message", (data) => {
      if (data.message.conversationId === conversation.id) {
        setMessages((prev) => [...prev, data.message]);
      }
    });

    return () => {
      removeHandler("private_message");
    };
  }, [conversation.id, addHandler, removeHandler]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    send({
      type: "private_message",
      conversationId: conversation.id,
      recipientId,
      content: newMessage.trim()
    });
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-3 border-b">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-conversations">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarImage src={conversation.otherAvatarImageUrl || ""} alt={conversation.otherUsername} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {conversation.otherUsername.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h2 className="font-semibold" data-testid="text-conversation-user">{conversation.otherUsername}</h2>
      </div>

      <ScrollArea className="flex-1 p-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.senderId === currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                  data-testid={`pm-${msg.id}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={msg.avatarImageUrl || ""} alt={msg.username} />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {msg.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[70%] ${isOwn ? "text-right" : ""}`}>
                    <p className={`text-sm p-2 rounded-lg ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {msg.content}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No messages yet. Say hello!
          </p>
        )}
      </ScrollArea>

      <div className="p-3 border-t flex gap-2">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          data-testid="input-private-message"
        />
        <Button onClick={handleSend} data-testid="button-send-private-message">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function Chat() {
  const { toast } = useToast();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  const initialUserId = urlParams.get("user");

  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithUser | null>(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [createRoomOpen, setCreateRoomOpen] = useState(false);

  const { data: currentUser } = useQuery<UserWithAvatar | null>({
    queryKey: ["/api/me"],
  });

  const { data: chatRooms, isLoading: roomsLoading } = useQuery<ChatRoom[]>({
    queryKey: ["/api/chat-rooms"],
  });

  const { data: conversations, isLoading: conversationsLoading } = useQuery<ConversationWithUser[]>({
    queryKey: ["/api/conversations"],
    enabled: !!currentUser,
  });

  const createRoom = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/chat-rooms", {
        name: newRoomName.trim(),
        description: newRoomDescription.trim() || null,
        isPublic: true
      });
    },
    onSuccess: () => {
      toast({ title: "Room created!" });
      queryClient.invalidateQueries({ queryKey: ["/api/chat-rooms"] });
      setNewRoomName("");
      setNewRoomDescription("");
      setCreateRoomOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createConversation = useMutation({
    mutationFn: async (otherUserId: string) => {
      const res = await apiRequest("POST", "/api/conversations", { otherUserId });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setSelectedConversation(data);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (initialUserId && currentUser && conversations) {
      const existing = conversations.find(
        (c) => c.user1Id === initialUserId || c.user2Id === initialUserId
      );
      if (existing) {
        setSelectedConversation(existing);
      } else {
        createConversation.mutate(initialUserId);
      }
    }
  }, [initialUserId, currentUser, conversations]);

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Please log in to access chat.</p>
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  if (selectedRoom) {
    return (
      <Card className="h-[calc(100vh-200px)] min-h-[400px]">
        <RoomChat room={selectedRoom} currentUser={currentUser} onBack={() => setSelectedRoom(null)} />
      </Card>
    );
  }

  if (selectedConversation) {
    return (
      <Card className="h-[calc(100vh-200px)] min-h-[400px]">
        <PrivateChat
          conversation={selectedConversation}
          currentUser={currentUser}
          onBack={() => setSelectedConversation(null)}
        />
      </Card>
    );
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6" data-testid="text-chat-title">
        Chat
      </h1>

      <Tabs defaultValue="rooms" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="rooms" data-testid="tab-rooms">
            <Hash className="h-4 w-4 mr-2" />
            Chat Rooms
          </TabsTrigger>
          <TabsTrigger value="messages" data-testid="tab-messages">
            <MessageCircle className="h-4 w-4 mr-2" />
            Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rooms">
          <div className="mb-4">
            <Dialog open={createRoomOpen} onOpenChange={setCreateRoomOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-room">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Chat Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="room-name">Room Name</Label>
                    <Input
                      id="room-name"
                      placeholder="Enter room name"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      data-testid="input-room-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="room-description">Description (optional)</Label>
                    <Input
                      id="room-description"
                      placeholder="What's this room about?"
                      value={newRoomDescription}
                      onChange={(e) => setNewRoomDescription(e.target.value)}
                      data-testid="input-room-description"
                    />
                  </div>
                  <Button
                    onClick={() => createRoom.mutate()}
                    disabled={!newRoomName.trim() || createRoom.isPending}
                    className="w-full"
                    data-testid="button-confirm-create-room"
                  >
                    Create Room
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {roomsLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
          ) : chatRooms && chatRooms.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {chatRooms.map((room) => (
                <Card
                  key={room.id}
                  className="cursor-pointer hover-elevate"
                  onClick={() => setSelectedRoom(room)}
                  data-testid={`room-${room.id}`}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Hash className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{room.name}</p>
                      {room.description && (
                        <p className="text-sm text-muted-foreground truncate">{room.description}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No chat rooms yet. Create one to get started!
            </p>
          )}
        </TabsContent>

        <TabsContent value="messages">
          {conversationsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
          ) : conversations && conversations.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {conversations.map((conv) => (
                <Card
                  key={conv.id}
                  className="cursor-pointer hover-elevate"
                  onClick={() => setSelectedConversation(conv)}
                  data-testid={`conversation-${conv.id}`}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={conv.otherAvatarImageUrl || ""} alt={conv.otherUsername} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {conv.otherUsername.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{conv.otherUsername}</p>
                      {conv.lastMessage && (
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No conversations yet. Go to the Friends page to message someone!
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

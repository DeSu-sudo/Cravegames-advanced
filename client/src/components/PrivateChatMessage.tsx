// client/src/components/PrivateChatMessage.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfilePopover } from "@/components/UserProfilePopover";

interface PrivateChatMessageProps {
  message: {
    id: string;
    senderId: string;
    content: string;
    createdAt: Date;
  };
  isOwnMessage: boolean;
  otherUser: {
    id: string;
    username: string;
    avatarImageUrl?: string | null;
  };
  currentUser: {
    id: string;
    username: string;
    avatarImageUrl?: string | null;
  };
}

export function PrivateChatMessage({
  message,
  isOwnMessage,
  otherUser,
  currentUser,
}: PrivateChatMessageProps) {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const user = isOwnMessage ? currentUser : otherUser;

  if (isOwnMessage) {
    return (
      <div className="flex gap-3 hover:bg-muted/30 px-2 py-1.5 rounded-lg transition-colors">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={user.avatarImageUrl || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-xs">
            {user.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-primary">
              {user.username}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTime(message.createdAt)}
            </span>
          </div>
          <p className="text-sm text-foreground break-words">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 hover:bg-muted/30 px-2 py-1.5 rounded-lg transition-colors">
      <UserProfilePopover
        userId={user.id}
        username={user.username}
        avatarUrl={user.avatarImageUrl}
      >
        <Avatar className="h-8 w-8 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
          <AvatarImage src={user.avatarImageUrl || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-xs">
            {user.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </UserProfilePopover>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <UserProfilePopover
            userId={user.id}
            username={user.username}
            avatarUrl={user.avatarImageUrl}
          >
            <span className="font-medium text-sm text-foreground hover:text-primary transition-colors">
              {user.username}
            </span>
          </UserProfilePopover>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.createdAt)}
          </span>
        </div>
        <p className="text-sm text-foreground break-words">{message.content}</p>
      </div>
    </div>
  );
}

// client/src/components/ChatMessage.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfilePopover } from "@/components/UserProfilePopover";
import type { ChatMessageWithUser } from "@shared/schema";

interface ChatMessageProps {
  message: ChatMessageWithUser;
  isOwnMessage: boolean;
}

export function ChatMessage({ message, isOwnMessage }: ChatMessageProps) {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isOwnMessage) {
    return (
      <div className="flex gap-3 hover:bg-muted/30 px-2 py-1.5 rounded-lg transition-colors">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.avatarImageUrl || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-xs">
            {message.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-primary">
              {message.username}
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
        userId={message.userId}
        username={message.username}
        avatarUrl={message.avatarImageUrl}
      >
        <Avatar className="h-8 w-8 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
          <AvatarImage src={message.avatarImageUrl || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-xs">
            {message.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </UserProfilePopover>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <UserProfilePopover
            userId={message.userId}
            username={message.username}
            avatarUrl={message.avatarImageUrl}
          >
            <span className="font-medium text-sm text-foreground hover:text-primary transition-colors">
              {message.username}
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

// client/src/components/UserProfilePopover.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  UserPlus,
  UserMinus,
  MessageCircle,
  Ban,
  Loader2,
  Clock,
  Check,
} from "lucide-react";
import type { UserWithAvatar, FriendWithInfo, FriendRequestWithUser } from "@shared/schema";

interface UserProfilePopoverProps {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  children: React.ReactNode;
}

export function UserProfilePopover({
  userId,
  username,
  avatarUrl,
  children,
}: UserProfilePopoverProps) {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user
  const { data: currentUser } = useQuery<UserWithAvatar | null>({
    queryKey: ["/api/me"],
  });

  // Get friends list to check if already friends
  const { data: friends } = useQuery<FriendWithInfo[]>({
    queryKey: ["/api/friends"],
    enabled: !!currentUser && open,
  });

  // Get sent friend requests to check if request is pending
  const { data: sentRequests } = useQuery<FriendRequestWithUser[]>({
    queryKey: ["/api/friend-requests/sent"],
    enabled: !!currentUser && open,
  });

  // Get received friend requests
  const { data: receivedRequests } = useQuery<FriendRequestWithUser[]>({
    queryKey: ["/api/friend-requests"],
    enabled: !!currentUser && open,
  });

  // Get blocked users
  const { data: blockedUsers } = useQuery<any[]>({
    queryKey: ["/api/blocked-users"],
    enabled: !!currentUser && open,
  });

  const isSelf = currentUser?.id === userId;
  const isFriend = friends?.some((f) => f.friendId === userId);
  const hasSentRequest = sentRequests?.some((r) => r.toUserId === userId);
  const hasReceivedRequest = receivedRequests?.find((r) => r.fromUserId === userId);
  const isBlocked = blockedUsers?.some((b) => b.blockedUserId === userId);

  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/friend-requests", { toUserId: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests/sent"] });
      toast({
        title: "Friend request sent",
        description: `Sent a friend request to ${username}`,
      });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Accept friend request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async () => {
      if (!hasReceivedRequest) return;
      await apiRequest("POST", `/api/friend-requests/${hasReceivedRequest.id}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests"] });
      toast({
        title: "Friend added",
        description: `You are now friends with ${username}`,
      });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove friend mutation
  const removeFriendMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/friends/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Friend removed",
        description: `Removed ${username} from your friends`,
      });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Start conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/conversations", { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      navigate(`/chat?user=${userId}`);
      toast({
        title: "Opening chat",
        description: `Starting conversation with ${username}`,
      });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Block user mutation
  const blockUserMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/blocked-users", { blockedUserId: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocked-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "User blocked",
        description: `Blocked ${username}`,
      });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unblock user mutation
  const unblockUserMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/blocked-users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocked-users"] });
      toast({
        title: "User unblocked",
        description: `Unblocked ${username}`,
      });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading =
    sendRequestMutation.isPending ||
    acceptRequestMutation.isPending ||
    removeFriendMutation.isPending ||
    startConversationMutation.isPending ||
    blockUserMutation.isPending ||
    unblockUserMutation.isPending;

  // Don't show popover for self or if not logged in
  if (isSelf || !currentUser) {
    return <>{children}</>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="hover:underline cursor-pointer text-left">
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        {/* User header */}
        <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/5">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-background">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                {username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold text-foreground">{username}</h4>
              {isFriend && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-500" />
                  Friend
                </span>
              )}
              {hasSentRequest && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3 text-yellow-500" />
                  Request pending
                </span>
              )}
              {hasReceivedRequest && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3 text-blue-500" />
                  Wants to be friends
                </span>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="p-2 space-y-1">
          {/* Friend actions */}
          {isBlocked ? (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
              onClick={() => unblockUserMutation.mutate()}
              disabled={isLoading}
            >
              {unblockUserMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Ban className="h-4 w-4" />
              )}
              Unblock User
            </Button>
          ) : (
            <>
              {isFriend ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-sm text-destructive hover:text-destructive"
                  onClick={() => removeFriendMutation.mutate()}
                  disabled={isLoading}
                >
                  {removeFriendMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserMinus className="h-4 w-4" />
                  )}
                  Remove Friend
                </Button>
              ) : hasReceivedRequest ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-sm text-green-600 hover:text-green-600"
                  onClick={() => acceptRequestMutation.mutate()}
                  disabled={isLoading}
                >
                  {acceptRequestMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Accept Friend Request
                </Button>
              ) : hasSentRequest ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-sm"
                  disabled
                >
                  <Clock className="h-4 w-4" />
                  Request Pending
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-sm"
                  onClick={() => sendRequestMutation.mutate()}
                  disabled={isLoading}
                >
                  {sendRequestMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Add Friend
                </Button>
              )}

              {/* Message */}
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-sm"
                onClick={() => startConversationMutation.mutate()}
                disabled={isLoading}
              >
                {startConversationMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
                Send Message
              </Button>

              <Separator className="my-1" />

              {/* Block */}
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-sm text-destructive hover:text-destructive"
                onClick={() => blockUserMutation.mutate()}
                disabled={isLoading}
              >
                {blockUserMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Ban className="h-4 w-4" />
                )}
                Block User
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

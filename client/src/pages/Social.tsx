import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, UserPlus, UserMinus, UserX, Search, Check, X, Ban, MessageCircle } from "lucide-react";
import type { FriendWithInfo, FriendRequestWithUser, BlockedUser, UserWithAvatar } from "@shared/schema";

type SearchResult = { id: string; username: string; avatarImageUrl: string | null };

export default function Social() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const { data: currentUser } = useQuery<UserWithAvatar | null>({
    queryKey: ["/api/me"],
  });

  const { data: friends, isLoading: friendsLoading } = useQuery<FriendWithInfo[]>({
    queryKey: ["/api/friends"],
    enabled: !!currentUser,
  });

  const { data: friendRequests, isLoading: requestsLoading } = useQuery<FriendRequestWithUser[]>({
    queryKey: ["/api/friend-requests"],
    enabled: !!currentUser,
  });

  const { data: sentRequests } = useQuery<FriendRequestWithUser[]>({
    queryKey: ["/api/friend-requests/sent"],
    enabled: !!currentUser,
  });

  const { data: blockedUsers, isLoading: blockedLoading } = useQuery<(BlockedUser & { username: string; avatarImageUrl: string | null })[]>({
    queryKey: ["/api/blocked-users"],
    enabled: !!currentUser,
  });

  const sendFriendRequest = useMutation({
    mutationFn: async (toUserId: string) => {
      await apiRequest("POST", "/api/friend-requests", { toUserId });
    },
    onSuccess: () => {
      toast({ title: "Friend request sent!" });
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests/sent"] });
      setSearchResults([]);
      setSearchQuery("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const acceptRequest = useMutation({
    mutationFn: async (requestId: string) => {
      await apiRequest("POST", `/api/friend-requests/${requestId}/accept`);
    },
    onSuccess: () => {
      toast({ title: "Friend request accepted!" });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectRequest = useMutation({
    mutationFn: async (requestId: string) => {
      await apiRequest("POST", `/api/friend-requests/${requestId}/reject`);
    },
    onSuccess: () => {
      toast({ title: "Friend request rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeFriend = useMutation({
    mutationFn: async (friendId: string) => {
      await apiRequest("DELETE", `/api/friends/${friendId}`);
    },
    onSuccess: () => {
      toast({ title: "Friend removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const blockUser = useMutation({
    mutationFn: async (blockedUserId: string) => {
      await apiRequest("POST", "/api/blocked-users", { blockedUserId });
    },
    onSuccess: () => {
      toast({ title: "User blocked" });
      queryClient.invalidateQueries({ queryKey: ["/api/blocked-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const unblockUser = useMutation({
    mutationFn: async (blockedUserId: string) => {
      await apiRequest("DELETE", `/api/blocked-users/${blockedUserId}`);
    },
    onSuccess: () => {
      toast({ title: "User unblocked" });
      queryClient.invalidateQueries({ queryKey: ["/api/blocked-users"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const isAlreadyFriend = (userId: string) => {
    return friends?.some((f) => f.friendId === userId);
  };

  const hasPendingRequest = (userId: string) => {
    return sentRequests?.some((r) => r.toUserId === userId && r.status === "pending");
  };

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Please log in to access social features.</p>
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6" data-testid="text-social-title">
        Friends & Social
      </h1>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="mb-4 w-full justify-start flex-wrap gap-1">
          <TabsTrigger value="friends" data-testid="tab-friends">
            <Users className="h-4 w-4 mr-2" />
            Friends ({friends?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="requests" data-testid="tab-requests">
            <UserPlus className="h-4 w-4 mr-2" />
            Requests ({friendRequests?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="blocked" data-testid="tab-blocked">
            <Ban className="h-4 w-4 mr-2" />
            Blocked ({blockedUsers?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="search" data-testid="tab-search">
            <Search className="h-4 w-4 mr-2" />
            Find Friends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          {friendsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : friends && friends.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {friends.map((friend) => (
                <Card key={friend.id} className="overflow-visible">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage src={friend.avatarImageUrl || ""} alt={friend.username} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {friend.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" data-testid={`text-friend-${friend.friendId}`}>
                        {friend.username}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        title="Message"
                        data-testid={`button-message-${friend.friendId}`}
                      >
                        <Link href={`/chat?user=${friend.friendId}`}>
                          <MessageCircle className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFriend.mutate(friend.friendId)}
                        disabled={removeFriend.isPending}
                        title="Remove friend"
                        data-testid={`button-remove-friend-${friend.friendId}`}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => blockUser.mutate(friend.friendId)}
                        disabled={blockUser.isPending}
                        title="Block user"
                        data-testid={`button-block-${friend.friendId}`}
                      >
                        <UserX className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              You don't have any friends yet. Use the "Find Friends" tab to search for users!
            </p>
          )}
        </TabsContent>

        <TabsContent value="requests">
          {requestsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : friendRequests && friendRequests.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Incoming Requests</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {friendRequests.map((request) => (
                  <Card key={request.id} className="overflow-visible">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={request.fromAvatarImageUrl || ""} alt={request.fromUsername} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {request.fromUsername.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate" data-testid={`text-request-${request.id}`}>
                          {request.fromUsername}
                        </p>
                        <p className="text-xs text-muted-foreground">wants to be your friend</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="default"
                          size="icon"
                          onClick={() => acceptRequest.mutate(request.id)}
                          disabled={acceptRequest.isPending}
                          title="Accept"
                          data-testid={`button-accept-${request.id}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => rejectRequest.mutate(request.id)}
                          disabled={rejectRequest.isPending}
                          title="Reject"
                          data-testid={`button-reject-${request.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No pending friend requests.
            </p>
          )}
        </TabsContent>

        <TabsContent value="blocked">
          {blockedLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : blockedUsers && blockedUsers.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {blockedUsers.map((blocked) => (
                <Card key={blocked.id} className="overflow-visible">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage src={blocked.avatarImageUrl || ""} alt={blocked.username} />
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {blocked.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" data-testid={`text-blocked-${blocked.blockedUserId}`}>
                        {blocked.username}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unblockUser.mutate(blocked.blockedUserId)}
                      disabled={unblockUser.isPending}
                      data-testid={`button-unblock-${blocked.blockedUserId}`}
                    >
                      Unblock
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              You haven't blocked anyone.
            </p>
          )}
        </TabsContent>

        <TabsContent value="search">
          <div className="space-y-4">
            <div className="flex gap-2 max-w-md">
              <Input
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                data-testid="input-search-users"
              />
              <Button onClick={handleSearch} disabled={isSearching} data-testid="button-search-users">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {isSearching ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {searchResults
                  .filter((user) => user.id !== currentUser.id)
                  .map((user) => (
                    <Card key={user.id} className="overflow-visible">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarImage src={user.avatarImageUrl || ""} alt={user.username} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate" data-testid={`text-search-result-${user.id}`}>
                            {user.username}
                          </p>
                        </div>
                        {isAlreadyFriend(user.id) ? (
                          <Button variant="outline" size="sm" disabled>
                            Friends
                          </Button>
                        ) : hasPendingRequest(user.id) ? (
                          <Button variant="outline" size="sm" disabled>
                            Pending
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => sendFriendRequest.mutate(user.id)}
                            disabled={sendFriendRequest.isPending}
                            data-testid={`button-add-friend-${user.id}`}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : searchQuery && !isSearching ? (
              <p className="text-muted-foreground">No users found matching "{searchQuery}"</p>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

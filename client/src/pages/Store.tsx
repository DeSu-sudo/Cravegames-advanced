import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { StoreItem, User } from "@shared/schema";

interface StoreData {
  items: StoreItem[];
  ownedItemIds: string[];
}

export default function Store() {
  const { toast } = useToast();

  const { data: currentUser } = useQuery<User | null>({
    queryKey: ["/api/me"],
  });

  const { data, isLoading } = useQuery<StoreData>({
    queryKey: ["/api/store"],
  });

  const buyMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest("POST", `/api/store/buy/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({ title: "Purchase successful!" });
    },
    onError: (error: Error) => {
      toast({ title: "Purchase failed", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load store.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-store-title">
          Avatar Store
        </h1>
        <p className="text-muted-foreground mt-1">
          Use your Crave Coins to buy new collectible avatars!
        </p>
      </div>

      {/* Store Grid */}
      {data.items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">There are no items in the store right now. Check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {data.items.map((item) => {
            const isOwned = data.ownedItemIds.includes(item.id);
            const canAfford = currentUser && currentUser.craveCoins >= item.price;

            return (
              <Card
                key={item.id}
                className="overflow-hidden"
                data-testid={`store-item-${item.id}`}
              >
                <div className="aspect-square bg-muted/30 flex items-center justify-center p-4">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="p-3 md:p-4">
                  <h3 className="font-semibold text-sm md:text-base truncate mb-2">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs">
                      C
                    </div>
                    <span className="font-semibold">{item.price.toLocaleString()}</span>
                  </div>
                  {isOwned ? (
                    <Button variant="secondary" className="w-full" disabled data-testid="button-owned">
                      Owned
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => buyMutation.mutate(item.id)}
                      disabled={!currentUser || !canAfford || buyMutation.isPending}
                      data-testid="button-buy"
                    >
                      {!currentUser ? "Login to Buy" : !canAfford ? "Not Enough Coins" : "Buy"}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { StoreItem, User } from "@shared/schema";

interface InventoryData {
  items: StoreItem[];
  activeAvatarId: string | null;
}

export default function Inventory() {
  const { toast } = useToast();

  const { data: currentUser } = useQuery<User | null>({
    queryKey: ["/api/me"],
  });

  const { data, isLoading } = useQuery<InventoryData>({
    queryKey: ["/api/inventory"],
    enabled: !!currentUser,
  });

  const setAvatarMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest("POST", `/api/inventory/set-avatar/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({ title: "Avatar updated!" });
    },
  });

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Please log in to view your inventory.</p>
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <Skeleton className="h-9 w-56 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load inventory.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-inventory-title">
          My Avatar Collection
        </h1>
        <p className="text-muted-foreground mt-1">
          Select an avatar to display on your profile.
        </p>
      </div>

      {/* Inventory Grid */}
      {data.items.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-card-border">
          <p className="text-muted-foreground mb-4">You don't own any avatars yet!</p>
          <Button asChild>
            <Link href="/store" data-testid="link-store">Visit the Store</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {data.items.map((item) => {
            const isActive = data.activeAvatarId === item.id;

            return (
              <Card
                key={item.id}
                className={cn(
                  "overflow-hidden transition-all",
                  isActive && "ring-2 ring-primary"
                )}
                data-testid={`inventory-item-${item.id}`}
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
                  <h3 className="font-semibold text-sm md:text-base truncate mb-3">
                    {item.name}
                  </h3>
                  <Button
                    variant={isActive ? "secondary" : "default"}
                    className="w-full"
                    onClick={() => !isActive && setAvatarMutation.mutate(item.id)}
                    disabled={isActive || setAvatarMutation.isPending}
                    data-testid={isActive ? "button-active" : "button-select"}
                  >
                    {isActive ? "Active" : "Select"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { GamesGrid } from "@/components/games/GamesGrid";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Game, User } from "@shared/schema";

export default function Favorites() {
  const { data: currentUser } = useQuery<User | null>({
    queryKey: ["/api/me"],
  });

  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ["/api/favorites"],
    enabled: !!currentUser,
  });

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Please log in to view your favorites.</p>
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-9 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6" data-testid="text-favorites-title">
        My Favorites
      </h1>
      <GamesGrid
        games={games || []}
        emptyMessage="You haven't favorited any games yet. Click the heart icon on a game page to add it to your favorites!"
      />
    </div>
  );
}

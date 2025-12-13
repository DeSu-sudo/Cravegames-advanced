import { useQuery } from "@tanstack/react-query";
import { GameCarousel } from "@/components/games/GameCarousel";
import { Skeleton } from "@/components/ui/skeleton";
import type { Game, Category } from "@shared/schema";

interface HomeData {
  trendingGames: Game[];
  gamesByCategory: { category: Category; games: Game[] }[];
}

export default function Home() {
  const { data, isLoading } = useQuery<HomeData>({
    queryKey: ["/api/home"],
  });

  if (isLoading) {
    return (
      <div className="space-y-8 md:space-y-12">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="flex gap-3 md:gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5].map((j) => (
                <Skeleton key={j} className="w-[160px] sm:w-[180px] md:w-[200px] aspect-[4/3] rounded-lg flex-shrink-0" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load games.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Trending Section */}
      {data.trendingGames.length > 0 && (
        <GameCarousel
          title="Trending now"
          subtitle="Play and explore our top trending games across all categories!"
          games={data.trendingGames}
          showFireIcon
        />
      )}

      {/* Category Sections */}
      {data.gamesByCategory.map(({ category, games }) => (
        <GameCarousel
          key={category.id}
          title={category.name}
          games={games}
          seeAllHref={`/category/${category.name}`}
        />
      ))}
    </div>
  );
}

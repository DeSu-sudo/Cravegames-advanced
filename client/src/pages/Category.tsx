import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { GamesGrid } from "@/components/games/GamesGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import type { Game } from "@shared/schema";

export default function Category() {
  const { name } = useParams<{ name: string }>();
  const [sortBy, setSortBy] = useState("play_count");

  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ["/api/category", name, sortBy],
  });

  const sortedGames = games ? [...games].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.averageRating - a.averageRating;
      case "newest":
        return 0; // Would use createdAt if available
      case "play_count":
      default:
        return b.playCount - a.playCount;
    }
  }) : [];

  if (isLoading) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-category-title">
          {decodeURIComponent(name || "")} Games
        </h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]" data-testid="select-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="play_count">Most Played</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Games Grid */}
      <GamesGrid 
        games={sortedGames} 
        emptyMessage="No games found in this category."
      />
    </div>
  );
}

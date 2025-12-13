import { GameCard } from "./GameCard";
import type { Game } from "@shared/schema";

interface GamesGridProps {
  games: Game[];
  emptyMessage?: string;
}

export function GamesGrid({ games, emptyMessage = "No games found." }: GamesGridProps) {
  if (games.length === 0) {
    return (
      <div className="text-center py-12" data-testid="empty-games">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5"
      data-testid="games-grid"
    >
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}

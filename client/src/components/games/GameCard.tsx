import { Link } from "wouter";
import { PlayCircle, Star, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Game } from "@shared/schema";

interface GameCardProps {
  game: Game;
  variant?: "default" | "carousel";
}

export function GameCard({ game, variant = "default" }: GameCardProps) {
  return (
    <Link href={`/game/${game.id}`}>
      <div
        className={cn(
          "group relative rounded-lg overflow-hidden cursor-pointer transition-transform duration-200 active:scale-[0.98]",
          variant === "carousel"
            ? "w-[160px] sm:w-[180px] md:w-[200px] flex-shrink-0 aspect-[4/3]"
            : "w-full aspect-[4/3]"
        )}
        data-testid={`card-game-${game.id}`}
      >
        {/* Thumbnail */}
        <img
          src={game.thumbnailUrl}
          alt={game.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Badges */}
        {game.badge === "new" && (
          <Badge
            variant="secondary"
            className="absolute top-2 left-2 bg-primary text-primary-foreground gap-1"
          >
            <Star className="h-3 w-3" />
            NEW
          </Badge>
        )}
        {game.badge === "hot" && (
          <Badge
            variant="secondary"
            className="absolute top-2 left-2 bg-orange-500 text-white gap-1"
          >
            <Flame className="h-3 w-3" />
            HOT
          </Badge>
        )}

        {/* Title and stats */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-semibold text-white text-sm md:text-base truncate mb-1">
            {game.name}
          </h3>
          {variant === "default" && (
            <div className="flex items-center gap-3 text-xs text-white/80">
              <span className="flex items-center gap-1">
                <PlayCircle className="h-3.5 w-3.5" />
                {game.playCount.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                {game.averageRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Hover play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
            <PlayCircle className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
      </div>
    </Link>
  );
}

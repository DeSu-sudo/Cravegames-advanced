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
          "group relative rounded-md overflow-hidden cursor-pointer transition-transform duration-200 active:scale-[0.98]",
          variant === "carousel"
            ? "w-[130px] sm:w-[145px] md:w-[160px] lg:w-[170px] flex-shrink-0 aspect-[4/3]"
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
            className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground gap-0.5 text-[10px] px-1.5 py-0"
          >
            <Star className="h-2.5 w-2.5" />
            NEW
          </Badge>
        )}
        {game.badge === "hot" && (
          <Badge
            variant="secondary"
            className="absolute top-1.5 left-1.5 bg-orange-500 text-white gap-0.5 text-[10px] px-1.5 py-0"
          >
            <Flame className="h-2.5 w-2.5" />
            HOT
          </Badge>
        )}

        {/* Title and stats */}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <h3 className="font-medium text-white text-xs md:text-sm truncate">
            {game.name}
          </h3>
          {variant === "default" && (
            <div className="flex items-center gap-2 text-[10px] text-white/80 mt-0.5">
              <span className="flex items-center gap-0.5">
                <PlayCircle className="h-3 w-3" />
                {game.playCount.toLocaleString()}
              </span>
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {game.averageRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Hover play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center shadow-md">
            <PlayCircle className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
      </div>
    </Link>
  );
}

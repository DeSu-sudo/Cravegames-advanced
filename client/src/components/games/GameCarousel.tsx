import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameCard } from "./GameCard";
import { cn } from "@/lib/utils";
import type { Game } from "@shared/schema";

interface GameCarouselProps {
  title: string;
  subtitle?: string;
  games: Game[];
  showFireIcon?: boolean;
  seeAllHref?: string;
}

export function GameCarousel({ title, subtitle, games, showFireIcon, seeAllHref }: GameCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        scrollEl.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [games]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const cardWidth = 200 + 12; // card width + gap
    const scrollAmount = direction === "left" ? -cardWidth * 3 : cardWidth * 3;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  if (games.length === 0) return null;

  return (
    <section className="mb-8 md:mb-12" data-testid={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 md:mb-5 px-1">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            {title}
            {showFireIcon && (
              <Flame className="h-5 w-5 md:h-6 md:w-6 text-orange-500 fill-orange-500" />
            )}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {seeAllHref && (
          <Button variant="outline" size="sm" className="self-start sm:self-auto rounded-full" asChild>
            <a href={seeAllHref} data-testid="button-see-all">See All</a>
          </Button>
        )}
      </div>

      {/* Carousel container */}
      <div className="relative group">
        {/* Left arrow - hidden on mobile, visible on hover for desktop */}
        <Button
          variant="secondary"
          size="icon"
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full shadow-lg transition-all duration-200 hidden md:flex",
            canScrollLeft ? "opacity-0 group-hover:opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => scroll("left")}
          data-testid="button-carousel-prev"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex gap-3 md:gap-4 overflow-x-auto scroll-smooth scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {games.map((game) => (
            <GameCard key={game.id} game={game} variant="carousel" />
          ))}
        </div>

        {/* Right arrow - hidden on mobile, visible on hover for desktop */}
        <Button
          variant="secondary"
          size="icon"
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full shadow-lg transition-all duration-200 hidden md:flex",
            canScrollRight ? "opacity-0 group-hover:opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => scroll("right")}
          data-testid="button-carousel-next"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </section>
  );
}

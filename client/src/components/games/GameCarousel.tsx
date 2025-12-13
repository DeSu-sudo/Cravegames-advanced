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
    <section className="mb-4 md:mb-6" data-testid={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2 md:mb-3 px-1">
        <h2 className="text-base md:text-lg font-bold flex items-center gap-1.5">
          {title}
          {showFireIcon && (
            <Flame className="h-4 w-4 md:h-5 md:w-5 text-orange-500 fill-orange-500" />
          )}
        </h2>
        {seeAllHref && (
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2" asChild>
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
            "absolute left-1 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow-md transition-all duration-200 hidden md:flex",
            canScrollLeft ? "opacity-0 group-hover:opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => scroll("left")}
          data-testid="button-carousel-prev"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex gap-2 md:gap-3 overflow-x-auto scroll-smooth scrollbar-hide pb-1 -mx-4 px-4 md:mx-0 md:px-0"
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
            "absolute right-1 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow-md transition-all duration-200 hidden md:flex",
            canScrollRight ? "opacity-0 group-hover:opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => scroll("right")}
          data-testid="button-carousel-next"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

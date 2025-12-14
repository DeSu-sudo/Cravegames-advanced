import { useEffect } from "react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function RandomGame() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    async function fetchRandomGame() {
      try {
        const res = await fetch("/api/random", { credentials: "include" });
        if (res.ok) {
          const game = await res.json();
          setLocation(`/game/${game.id}`);
        } else {
          setLocation("/");
        }
      } catch {
        setLocation("/");
      }
    }
    fetchRandomGame();
  }, [setLocation]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="text-lg font-medium text-muted-foreground">Finding a random game...</div>
      <Skeleton className="w-64 h-48 rounded-lg" />
    </div>
  );
}

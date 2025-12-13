import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";

const MAX_CLICKS_PER_MINUTE = 10;
const COOLDOWN_DURATION = 60000; // 1 minute in ms

export default function MakeMore() {
  const [clicksRemaining, setClicksRemaining] = useState(MAX_CLICKS_PER_MINUTE);
  const [isAnimating, setIsAnimating] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const { data: currentUser, isLoading } = useQuery<User | null>({
    queryKey: ["/api/me"],
  });

  const clickMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/coins/click");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
  });

  // Handle cooldown timer
  useEffect(() => {
    if (!cooldownEnd) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, cooldownEnd - Date.now());
      setTimeLeft(Math.ceil(remaining / 1000));

      if (remaining <= 0) {
        setCooldownEnd(null);
        setClicksRemaining(MAX_CLICKS_PER_MINUTE);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownEnd]);

  const handleClick = useCallback(() => {
    if (clicksRemaining <= 0 || !currentUser) return;

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 150);

    clickMutation.mutate();

    const newClicksRemaining = clicksRemaining - 1;
    setClicksRemaining(newClicksRemaining);

    if (newClicksRemaining <= 0) {
      setCooldownEnd(Date.now() + COOLDOWN_DURATION);
    }
  }, [clicksRemaining, currentUser, clickMutation]);

  if (!currentUser && !isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Please log in to earn Crave Coins.</p>
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto">
        <Skeleton className="h-9 w-48 mb-6" />
        <Skeleton className="h-48 w-48 rounded-full mx-auto mb-6" />
        <Skeleton className="h-6 w-32 mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <h1 className="text-2xl md:text-3xl font-bold mb-6" data-testid="text-make-more-title">
        Earn Crave Coins
      </h1>

      {/* Balance Card */}
      <Card className="p-6 mb-8">
        <div className="text-4xl font-bold text-primary mb-2" data-testid="text-balance">
          {currentUser?.craveCoins.toLocaleString()}
        </div>
        <div className="text-muted-foreground">Your Crave Coin Balance</div>
      </Card>

      {/* Coin Clicker */}
      <div className="mb-6">
        <button
          onClick={handleClick}
          disabled={clicksRemaining <= 0 || clickMutation.isPending}
          className={cn(
            "w-36 h-36 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-primary to-purple-600 text-primary-foreground font-bold text-5xl md:text-7xl flex items-center justify-center mx-auto shadow-2xl transition-transform duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
            isAnimating && "scale-95"
          )}
          data-testid="button-coin-click"
        >
          C
        </button>
      </div>

      {/* Click counter */}
      <div className="text-lg mb-2" data-testid="text-clicks-remaining">
        {cooldownEnd ? (
          <span className="text-muted-foreground">
            Reset in: <span className="font-bold text-foreground">{timeLeft}s</span>
          </span>
        ) : (
          <span>
            Clicks remaining: <span className="font-bold">{clicksRemaining}</span>
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        You can click the coin up to 10 times per minute.
      </p>
    </div>
  );
}

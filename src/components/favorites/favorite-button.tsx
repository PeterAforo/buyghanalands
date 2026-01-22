"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Heart, Loader2 } from "lucide-react";

interface FavoriteButtonProps {
  listingId: string;
  variant?: "icon" | "button";
  className?: string;
}

export function FavoriteButton({ listingId, variant = "icon", className }: FavoriteButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (session?.user) {
      checkFavoriteStatus();
    } else {
      setIsChecking(false);
    }
  }, [session, listingId]);

  const checkFavoriteStatus = async () => {
    try {
      const res = await fetch(`/api/favorites/check?listingId=${listingId}`);
      const data = await res.json();
      setIsFavorited(data.isFavorited);
    } catch (error) {
      console.error("Error checking favorite status:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const toggleFavorite = async () => {
    if (!session) {
      router.push(`/auth/login?callbackUrl=/listings/${listingId}`);
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorited) {
        await fetch(`/api/favorites?listingId=${listingId}`, { method: "DELETE" });
        setIsFavorited(false);
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId }),
        });
        setIsFavorited(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return variant === "icon" ? (
      <button className={`p-2 rounded-full bg-white/80 ${className}`} disabled>
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </button>
    ) : (
      <Button variant="outline" disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (variant === "icon") {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite();
        }}
        disabled={isLoading}
        className={`p-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-all ${className}`}
        title={isFavorited ? "Remove from favorites" : "Add to favorites"}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        ) : (
          <Heart
            className={`h-5 w-5 transition-colors ${
              isFavorited ? "fill-red-500 text-red-500" : "text-gray-600 hover:text-red-500"
            }`}
          />
        )}
      </button>
    );
  }

  return (
    <Button
      variant={isFavorited ? "default" : "outline"}
      onClick={toggleFavorite}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Heart
          className={`h-4 w-4 mr-2 ${isFavorited ? "fill-current" : ""}`}
        />
      )}
      {isFavorited ? "Saved" : "Save"}
    </Button>
  );
}

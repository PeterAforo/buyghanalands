"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Heart,
  MapPin,
  Ruler,
  Trash2,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface FavoriteItem {
  id: string;
  listingId: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    region: string;
    district: string;
    town: string | null;
    landType: string;
    sizeAcres: string;
    priceGhs: string;
    verificationLevel: string;
    media: { url: string }[];
  };
}

function formatPrice(price: string | number) {
  const num = typeof price === "string" ? parseInt(price) : price;
  return `GH₵${num.toLocaleString()}`;
}

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/dashboard/favorites");
    } else if (session?.user) {
      fetchFavorites();
    }
  }, [session, status, router]);

  const fetchFavorites = async () => {
    try {
      const res = await fetch("/api/favorites");
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFavorite = async (listingId: string) => {
    setRemovingId(listingId);
    try {
      await fetch(`/api/favorites?listingId=${listingId}`, { method: "DELETE" });
      setFavorites((prev) => prev.filter((f) => f.listingId !== listingId));
    } catch (error) {
      console.error("Error removing favorite:", error);
    } finally {
      setRemovingId(null);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Favorites</h1>
            <p className="text-gray-600">{favorites.length} saved listings</p>
          </div>
        </div>

        {favorites.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No favorites yet</h2>
              <p className="text-gray-600 mb-6">
                Save listings you're interested in to view them later
              </p>
              <Link href="/listings">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Browse Listings
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {favorites.map((fav) => (
              <Card key={fav.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <div
                    className="h-48 bg-gray-200 bg-cover bg-center"
                    style={{
                      backgroundImage: fav.listing.media[0]
                        ? `url(${fav.listing.media[0].url})`
                        : undefined,
                    }}
                  >
                    {!fav.listing.media[0] && (
                      <div className="h-full flex items-center justify-center">
                        <MapPin className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeFavorite(fav.listingId)}
                    disabled={removingId === fav.listingId}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-all"
                  >
                    {removingId === fav.listingId ? (
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    ) : (
                      <Trash2 className="h-5 w-5 text-red-500" />
                    )}
                  </button>
                  <Badge className="absolute top-3 left-3 capitalize">
                    {fav.listing.landType.toLowerCase()}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                    {fav.listing.title}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    {fav.listing.district}, {fav.listing.region}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Ruler className="h-4 w-4 mr-1" />
                    {Number(fav.listing.sizeAcres).toFixed(2)} acres
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-emerald-600">
                      {formatPrice(fav.listing.priceGhs)}
                    </p>
                    <Link href={`/listings/${fav.listingId}`}>
                      <Button size="sm" variant="outline">
                        View
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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
  Bookmark,
  Bell,
  BellOff,
  Trash2,
  Loader2,
  Search,
  MapPin,
  Filter,
} from "lucide-react";

interface SavedSearch {
  id: string;
  name: string;
  filters: {
    region?: string;
    district?: string;
    landType?: string;
    minPrice?: number;
    maxPrice?: number;
    minSize?: number;
    maxSize?: number;
    tenureType?: string;
    verifiedOnly?: boolean;
  };
  alertEnabled: boolean;
  lastAlertAt: string | null;
  createdAt: string;
}

export default function SavedSearchesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/dashboard/saved-searches");
    } else if (session?.user) {
      fetchSearches();
    }
  }, [session, status, router]);

  const fetchSearches = async () => {
    try {
      const res = await fetch("/api/saved-searches");
      if (res.ok) {
        const data = await res.json();
        setSearches(data);
      }
    } catch (error) {
      console.error("Error fetching saved searches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAlert = async (id: string, currentState: boolean) => {
    setActionId(id);
    try {
      await fetch(`/api/saved-searches/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertEnabled: !currentState }),
      });
      setSearches((prev) =>
        prev.map((s) => (s.id === id ? { ...s, alertEnabled: !currentState } : s))
      );
    } catch (error) {
      console.error("Error toggling alert:", error);
    } finally {
      setActionId(null);
    }
  };

  const deleteSearch = async (id: string) => {
    setActionId(id);
    try {
      await fetch(`/api/saved-searches/${id}`, { method: "DELETE" });
      setSearches((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Error deleting search:", error);
    } finally {
      setActionId(null);
    }
  };

  const buildSearchUrl = (filters: SavedSearch["filters"]) => {
    const params = new URLSearchParams();
    if (filters.region) params.set("region", filters.region);
    if (filters.district) params.set("district", filters.district);
    if (filters.landType) params.set("landType", filters.landType);
    if (filters.minPrice) params.set("minPrice", filters.minPrice.toString());
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice.toString());
    if (filters.minSize) params.set("minSize", filters.minSize.toString());
    if (filters.maxSize) params.set("maxSize", filters.maxSize.toString());
    if (filters.tenureType) params.set("tenureType", filters.tenureType);
    if (filters.verifiedOnly) params.set("verified", "true");
    return `/listings?${params.toString()}`;
  };

  const formatFilters = (filters: SavedSearch["filters"]) => {
    const parts: string[] = [];
    if (filters.region) parts.push(filters.region);
    if (filters.landType) parts.push(filters.landType.toLowerCase());
    if (filters.minPrice || filters.maxPrice) {
      const min = filters.minPrice ? `GH₵${filters.minPrice.toLocaleString()}` : "Any";
      const max = filters.maxPrice ? `GH₵${filters.maxPrice.toLocaleString()}` : "Any";
      parts.push(`${min} - ${max}`);
    }
    return parts.join(" • ") || "All listings";
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
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Saved Searches</h1>
            <p className="text-gray-600">{searches.length} saved searches</p>
          </div>
        </div>

        {searches.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Bookmark className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No saved searches</h2>
              <p className="text-gray-600 mb-6">
                Save your search criteria to quickly find matching listings
              </p>
              <Link href="/listings">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Search className="h-4 w-4 mr-2" />
                  Start Searching
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {searches.map((search) => (
              <Card key={search.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {search.name}
                        </h3>
                        {search.alertEnabled && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Bell className="h-3 w-3" />
                            Alerts on
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                        <Filter className="h-4 w-4" />
                        {formatFilters(search.filters)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Saved {new Date(search.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={buildSearchUrl(search.filters)}>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                          <Search className="h-4 w-4 mr-1" />
                          Search
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAlert(search.id, search.alertEnabled)}
                        disabled={actionId === search.id}
                      >
                        {actionId === search.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : search.alertEnabled ? (
                          <BellOff className="h-4 w-4" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deleteSearch(search.id)}
                        disabled={actionId === search.id}
                      >
                        {actionId === search.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
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

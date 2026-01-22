"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Bookmark, Loader2, Bell, CheckCircle } from "lucide-react";

interface SaveSearchButtonProps {
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
  className?: string;
}

export function SaveSearchButton({ filters, className }: SaveSearchButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    if (!session) {
      router.push("/auth/login?callbackUrl=/listings");
      return;
    }
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Please enter a name for this search");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          filters,
          alertEnabled,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save search");
      }

      setIsSaved(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSaved(false);
        setName("");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate default name based on filters
  const generateDefaultName = () => {
    const parts: string[] = [];
    if (filters.landType) parts.push(filters.landType.toLowerCase());
    if (filters.region) parts.push(`in ${filters.region}`);
    if (filters.minPrice || filters.maxPrice) {
      if (filters.minPrice && filters.maxPrice) {
        parts.push(`GH₵${filters.minPrice.toLocaleString()}-${filters.maxPrice.toLocaleString()}`);
      } else if (filters.minPrice) {
        parts.push(`from GH₵${filters.minPrice.toLocaleString()}`);
      } else {
        parts.push(`up to GH₵${filters.maxPrice?.toLocaleString()}`);
      }
    }
    return parts.length > 0 ? parts.join(" ") : "My Search";
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handleClick}
        className={className}
      >
        <Bookmark className="h-4 w-4 mr-2" />
        Save Search
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save This Search</DialogTitle>
            <DialogDescription>
              Get notified when new listings match your criteria
            </DialogDescription>
          </DialogHeader>

          {isSaved ? (
            <div className="py-8 text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Search Saved!</h3>
              <p className="text-sm text-gray-500 mt-1">
                {alertEnabled ? "You'll be notified of new matches." : "View it in your dashboard."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={generateDefaultName()}
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="alertEnabled"
                  checked={alertEnabled}
                  onChange={(e) => setAlertEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="alertEnabled" className="flex items-center gap-2 cursor-pointer">
                  <Bell className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Notify me of new matches</span>
                </label>
              </div>

              {/* Show active filters */}
              <div className="text-sm text-gray-500">
                <p className="font-medium mb-1">Active Filters:</p>
                <ul className="space-y-1">
                  {filters.region && <li>• Region: {filters.region}</li>}
                  {filters.district && <li>• District: {filters.district}</li>}
                  {filters.landType && <li>• Type: {filters.landType}</li>}
                  {filters.tenureType && <li>• Tenure: {filters.tenureType}</li>}
                  {(filters.minPrice || filters.maxPrice) && (
                    <li>• Price: GH₵{filters.minPrice?.toLocaleString() || "0"} - GH₵{filters.maxPrice?.toLocaleString() || "Any"}</li>
                  )}
                  {(filters.minSize || filters.maxSize) && (
                    <li>• Size: {filters.minSize || "0"} - {filters.maxSize || "Any"} acres</li>
                  )}
                  {filters.verifiedOnly && <li>• Verified only</li>}
                </ul>
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4 mr-2" />
                      Save Search
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

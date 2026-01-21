"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { X, Loader2, DollarSign, CheckCircle } from "lucide-react";

interface MakeOfferModalProps {
  listingId: string;
  listingTitle: string;
  askingPrice: number;
  sellerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function MakeOfferModal({
  listingId,
  listingTitle,
  askingPrice,
  sellerId,
  onClose,
  onSuccess,
}: MakeOfferModalProps) {
  const [amount, setAmount] = useState(askingPrice.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          amountGhs: parseInt(amount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit offer");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
          <CardTitle>Make an Offer</CardTitle>
          <CardDescription>{listingTitle}</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Offer Submitted!</h3>
              <p className="text-gray-600">The seller will be notified of your offer.</p>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Asking Price</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatPrice(askingPrice)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Offer (GH₵)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10"
                  min={1}
                  required
                />
              </div>
              {parseInt(amount) < askingPrice && (
                <p className="text-sm text-amber-600 mt-1">
                  Your offer is {((1 - parseInt(amount) / askingPrice) * 100).toFixed(0)}% below asking price
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Offer"
                )}
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              By submitting, you agree to our terms of service. The seller will be notified of your offer.
            </p>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  CheckCircle, 
  CreditCard, 
  Smartphone, 
  Building2,
  Loader2,
  Lock,
  AlertCircle
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface EscrowCheckoutProps {
  listing: {
    id: string;
    title: string;
    priceGhs: number;
    region: string;
    district: string;
    seller: {
      fullName: string;
    };
  };
  onClose?: () => void;
}

export function EscrowCheckout({ listing, onClose }: EscrowCheckoutProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<"full" | "deposit">("full");

  const platformFee = Math.round(listing.priceGhs * 0.015); // 1.5% platform fee
  const depositAmount = Math.round(listing.priceGhs * 0.1); // 10% deposit
  const totalAmount = paymentType === "full" 
    ? listing.priceGhs + platformFee 
    : depositAmount + Math.round(depositAmount * 0.015);

  const handlePayment = async () => {
    if (!session) {
      router.push(`/auth/login?callbackUrl=/listings/${listing.id}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          amount: totalAmount,
          type: paymentType === "full" ? "FULL_PAYMENT" : "ESCROW_DEPOSIT",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment initialization failed");
      }

      if (data.paymentLink) {
        window.location.href = data.paymentLink;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="bg-emerald-50 border-b">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-emerald-600" />
          <CardTitle>Secure Escrow Payment</CardTitle>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Your payment is protected until you verify the land
        </p>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Listing Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900">{listing.title}</h3>
          <p className="text-sm text-gray-600">{listing.district}, {listing.region}</p>
          <p className="text-sm text-gray-500 mt-1">Seller: {listing.seller.fullName}</p>
        </div>

        {/* Payment Type Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Payment Option</label>
          
          <div 
            onClick={() => setPaymentType("full")}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              paymentType === "full" 
                ? "border-emerald-500 bg-emerald-50" 
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  paymentType === "full" ? "border-emerald-500" : "border-gray-300"
                }`}>
                  {paymentType === "full" && (
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Full Payment</p>
                  <p className="text-sm text-gray-500">Pay the full amount now</p>
                </div>
              </div>
              <p className="font-bold text-lg">GH₵{(listing.priceGhs + platformFee).toLocaleString()}</p>
            </div>
          </div>

          <div 
            onClick={() => setPaymentType("deposit")}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              paymentType === "deposit" 
                ? "border-emerald-500 bg-emerald-50" 
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  paymentType === "deposit" ? "border-emerald-500" : "border-gray-300"
                }`}>
                  {paymentType === "deposit" && (
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium">10% Deposit</p>
                  <p className="text-sm text-gray-500">Reserve the land, pay balance later</p>
                </div>
              </div>
              <p className="font-bold text-lg">GH₵{(depositAmount + Math.round(depositAmount * 0.015)).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {paymentType === "full" ? "Land Price" : "Deposit (10%)"}
            </span>
            <span>GH₵{(paymentType === "full" ? listing.priceGhs : depositAmount).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Platform Fee (1.5%)</span>
            <span>GH₵{(paymentType === "full" ? platformFee : Math.round(depositAmount * 0.015)).toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <span className="text-emerald-600">GH₵{totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Security Features */}
        <div className="bg-blue-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <Lock className="h-4 w-4" />
            <span>256-bit SSL encrypted payment</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <Shield className="h-4 w-4" />
            <span>Funds held in escrow until verification</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <CheckCircle className="h-4 w-4" />
            <span>Full refund if land verification fails</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="flex items-center justify-center gap-4 py-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <CreditCard className="h-3 w-3" />
            Card
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Smartphone className="h-3 w-3" />
            Mobile Money
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            Bank Transfer
          </Badge>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {onClose && (
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          )}
          <Button 
            onClick={handlePayment} 
            disabled={isLoading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 mr-2" />
                Pay Securely
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500">
          By proceeding, you agree to our Terms of Service and Escrow Agreement
        </p>
      </CardContent>
    </Card>
  );
}

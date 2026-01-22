"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Smartphone } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface CheckoutButtonProps {
  listingId: string;
  amount: number;
  type: "ESCROW_DEPOSIT" | "FULL_PAYMENT" | "LISTING_FEE";
  transactionId?: string;
  className?: string;
  children?: React.ReactNode;
}

export function CheckoutButton({
  listingId,
  amount,
  type,
  transactionId,
  className,
  children,
}: CheckoutButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!session) {
      router.push(`/auth/login?callbackUrl=/listings/${listingId}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          amount,
          type,
          transactionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment initialization failed");
      }

      // Redirect to Flutterwave payment page
      if (data.paymentLink) {
        window.location.href = data.paymentLink;
      } else {
        throw new Error("No payment link received");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleCheckout}
        disabled={isLoading}
        className={className}
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          children || (
            <>
              <CreditCard className="h-5 w-5 mr-2" />
              Pay GH₵{amount.toLocaleString()}
            </>
          )
        )}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

export function MobileMoneyButton({
  listingId,
  amount,
  type,
  transactionId,
  className,
}: CheckoutButtonProps) {
  return (
    <CheckoutButton
      listingId={listingId}
      amount={amount}
      type={type}
      transactionId={transactionId}
      className={className}
    >
      <Smartphone className="h-5 w-5 mr-2" />
      Pay with Mobile Money
    </CheckoutButton>
  );
}

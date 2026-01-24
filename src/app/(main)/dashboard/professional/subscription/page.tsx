"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Check,
  Loader2,
  Crown,
  Zap,
  Building2,
} from "lucide-react";

interface Plan {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: Record<string, boolean | number>;
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  billingCycle: string;
  priceGhs: number;
  startDate: string;
  endDate: string;
}

const PLAN_ICONS: Record<string, typeof Crown> = {
  BASIC: Zap,
  PREMIUM: Crown,
  ENTERPRISE: Building2,
};

const FEATURE_LABELS: Record<string, string> = {
  featuredListings: "Featured Listings",
  prioritySupport: "Priority Support",
  analytics: "Analytics Dashboard",
  verifiedBadge: "Verified Badge",
  instantAlerts: "Instant Alerts",
  apiAccess: "API Access",
  whiteLabel: "White Label",
};

export default function SubscriptionPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Record<string, Plan>>({});
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch("/api/subscriptions");
        if (response.ok) {
          const data = await response.json();
          setSubscription(data.subscription);
          setPlans(data.plans);
        }
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchSubscription();
    }
  }, [session]);

  const handleSubscribe = async (plan: string) => {
    setSubscribing(plan);
    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billingCycle }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to create subscription");
        return;
      }

      if (data.paymentRequired) {
        // Redirect to payment
        const paymentResponse = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "SUBSCRIPTION",
            amount: data.amount,
            subscriptionId: data.subscription.id,
          }),
        });

        const paymentData = await paymentResponse.json();
        if (paymentData.paymentUrl) {
          window.location.href = paymentData.paymentUrl;
        }
      }
    } catch (error) {
      console.error("Subscription error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubscribing(null);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login?callbackUrl=/dashboard/professional/subscription");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/professional">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
        </div>

        {/* Current Subscription */}
        {subscription && (
          <Card className="mb-8 border-emerald-200 bg-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-emerald-600" />
                Current Plan: {subscription.plan}
              </CardTitle>
              <CardDescription>
                {subscription.status === "ACTIVE" ? (
                  <>Active until {new Date(subscription.endDate).toLocaleDateString()}</>
                ) : (
                  <>Status: {subscription.status}</>
                )}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center bg-white rounded-lg p-1 border">
            <button
              onClick={() => setBillingCycle("MONTHLY")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === "MONTHLY"
                  ? "bg-emerald-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("YEARLY")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === "YEARLY"
                  ? "bg-emerald-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Yearly
              <Badge variant="success" className="ml-2">Save 17%</Badge>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(plans).map(([key, plan]) => {
            const Icon = PLAN_ICONS[key] || Zap;
            const price = billingCycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;
            const isCurrentPlan = subscription?.plan === key && subscription?.status === "ACTIVE";

            return (
              <Card
                key={key}
                className={`relative ${
                  key === "PREMIUM" ? "border-emerald-500 border-2" : ""
                } ${isCurrentPlan ? "ring-2 ring-emerald-500" : ""}`}
              >
                {key === "PREMIUM" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-600">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">GH₵{price}</span>
                    <span className="text-gray-500">
                      /{billingCycle === "YEARLY" ? "year" : "month"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {Object.entries(plan.features).map(([feature, value]) => {
                      if (value === false) return null;
                      const label = FEATURE_LABELS[feature] || feature;
                      const displayValue = typeof value === "number"
                        ? value === -1 ? "Unlimited" : `${value}`
                        : "";

                      return (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <span className="text-sm">
                            {displayValue && <strong>{displayValue}</strong>} {label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {isCurrentPlan ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={key === "PREMIUM" ? "default" : "outline"}
                      onClick={() => handleSubscribe(key)}
                      disabled={subscribing === key}
                    >
                      {subscribing === key ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Subscribe to ${plan.name}`
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium">Can I cancel my subscription?</h4>
              <p className="text-sm text-gray-600">
                Yes, you can cancel anytime. Your benefits will continue until the end of your billing period.
              </p>
            </div>
            <div>
              <h4 className="font-medium">Can I upgrade or downgrade?</h4>
              <p className="text-sm text-gray-600">
                Yes, you can change your plan at any time. Changes take effect at the start of your next billing cycle.
              </p>
            </div>
            <div>
              <h4 className="font-medium">What payment methods are accepted?</h4>
              <p className="text-sm text-gray-600">
                We accept Mobile Money (MTN, Vodafone, AirtelTigo) and card payments via Flutterwave.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

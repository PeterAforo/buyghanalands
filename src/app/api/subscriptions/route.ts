import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createSubscriptionSchema = z.object({
  plan: z.enum(["BASIC", "PREMIUM", "ENTERPRISE"]),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
});

// Subscription plans with pricing
const PLANS = {
  BASIC: {
    name: "Basic",
    monthlyPrice: 50,
    yearlyPrice: 500,
    features: {
      featuredListings: 1,
      prioritySupport: false,
      analytics: false,
      verifiedBadge: false,
      instantAlerts: 5,
    },
  },
  PREMIUM: {
    name: "Premium",
    monthlyPrice: 150,
    yearlyPrice: 1500,
    features: {
      featuredListings: 5,
      prioritySupport: true,
      analytics: true,
      verifiedBadge: true,
      instantAlerts: 20,
    },
  },
  ENTERPRISE: {
    name: "Enterprise",
    monthlyPrice: 500,
    yearlyPrice: 5000,
    features: {
      featuredListings: -1, // unlimited
      prioritySupport: true,
      analytics: true,
      verifiedBadge: true,
      instantAlerts: -1, // unlimited
      apiAccess: true,
      whiteLabel: true,
    },
  },
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    return NextResponse.json({
      subscription,
      plans: PLANS,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createSubscriptionSchema.parse(body);

    // Check for existing active subscription
    const existing = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Already have an active subscription" }, { status: 400 });
    }

    const plan = PLANS[data.plan];
    const price = data.billingCycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date();
    if (data.billingCycle === "YEARLY") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        plan: data.plan,
        billingCycle: data.billingCycle,
        priceGhs: price,
        status: "PENDING",
        startDate,
        endDate,
        features: plan.features,
      },
    });

    // Return subscription with payment link (integrate with Flutterwave)
    return NextResponse.json({
      subscription,
      paymentRequired: true,
      amount: price,
      currency: "GHS",
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error creating subscription:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}

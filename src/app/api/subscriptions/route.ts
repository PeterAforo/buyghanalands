import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  BUYER_PLANS,
  SELLER_PLANS,
  AGENT_PLANS,
  PROFESSIONAL_PLANS,
  getPlanPrice,
  calculateEndDate,
} from "@/lib/subscriptions";

const createSubscriptionSchema = z.object({
  category: z.enum(["BUYER", "SELLER", "AGENT", "PROFESSIONAL"]),
  plan: z.string(),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
});

// Helper to get plan config based on category
function getPlanConfig(category: string, plan: string) {
  switch (category) {
    case "BUYER":
      return BUYER_PLANS[plan as keyof typeof BUYER_PLANS];
    case "SELLER":
      return SELLER_PLANS[plan as keyof typeof SELLER_PLANS];
    case "AGENT":
      return AGENT_PLANS[plan as keyof typeof AGENT_PLANS];
    case "PROFESSIONAL":
      return PROFESSIONAL_PLANS[plan as keyof typeof PROFESSIONAL_PLANS];
    default:
      return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category")?.toUpperCase();

    // Get user's active subscriptions
    const whereClause: any = {
      userId: session.user.id,
      status: "ACTIVE",
    };

    if (category) {
      whereClause.category = category;
    }

    const subscriptions = await prisma.subscription.findMany({
      where: whereClause,
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    // Format subscriptions with plan details
    const formattedSubscriptions = subscriptions.map((sub) => {
      let planName = null;
      let planConfig = null;

      switch (sub.category) {
        case "BUYER":
          planName = sub.buyerPlan;
          planConfig = sub.buyerPlan ? BUYER_PLANS[sub.buyerPlan] : null;
          break;
        case "SELLER":
          planName = sub.sellerPlan;
          planConfig = sub.sellerPlan ? SELLER_PLANS[sub.sellerPlan] : null;
          break;
        case "AGENT":
          planName = sub.agentPlan;
          planConfig = sub.agentPlan ? AGENT_PLANS[sub.agentPlan] : null;
          break;
        case "PROFESSIONAL":
          planName = sub.professionalPlan;
          planConfig = sub.professionalPlan ? PROFESSIONAL_PLANS[sub.professionalPlan] : null;
          break;
      }

      return {
        ...sub,
        planName,
        planConfig,
      };
    });

    return NextResponse.json({
      subscriptions: formattedSubscriptions,
      plans: {
        buyer: Object.values(BUYER_PLANS),
        seller: Object.values(SELLER_PLANS),
        agent: Object.values(AGENT_PLANS),
        professional: Object.values(PROFESSIONAL_PLANS),
      },
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

    // Validate plan exists for category
    const planConfig = getPlanConfig(data.category, data.plan);
    if (!planConfig) {
      return NextResponse.json(
        { error: `Invalid plan '${data.plan}' for category '${data.category}'` },
        { status: 400 }
      );
    }

    // Check for existing active subscription in this category
    const existing = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        category: data.category as any,
        status: "ACTIVE",
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Already have an active ${data.category.toLowerCase()} subscription` },
        { status: 400 }
      );
    }

    const price = getPlanPrice(data.category as any, data.plan as any, data.billingCycle as any);
    const startDate = new Date();
    const endDate = calculateEndDate(startDate, data.billingCycle as any);

    // Build subscription data based on category
    const subscriptionData: any = {
      userId: session.user.id,
      category: data.category,
      billingCycle: data.billingCycle,
      priceGhs: price,
      status: price === 0 ? "ACTIVE" : "PENDING", // Free plans are immediately active
      startDate,
      endDate,
      features: planConfig.features,
      autoRenew: price > 0,
    };

    // Set category-specific plan field and limits
    switch (data.category) {
      case "BUYER":
        subscriptionData.buyerPlan = data.plan;
        break;
      case "SELLER":
        subscriptionData.sellerPlan = data.plan;
        const sellerConfig = planConfig as any;
        subscriptionData.listingLimit = sellerConfig.listingLimit;
        subscriptionData.transactionFeeRate = sellerConfig.transactionFeeRate;
        break;
      case "AGENT":
        subscriptionData.agentPlan = data.plan;
        const agentConfig = planConfig as any;
        subscriptionData.clientLimit = agentConfig.clientLimit;
        subscriptionData.listingLimit = agentConfig.listingLimit;
        break;
      case "PROFESSIONAL":
        subscriptionData.professionalPlan = data.plan;
        const profConfig = planConfig as any;
        subscriptionData.leadLimit = profConfig.leadLimit;
        subscriptionData.serviceCommissionRate = profConfig.serviceCommissionRate;
        break;
    }

    const subscription = await prisma.subscription.create({
      data: subscriptionData,
    });

    // Add role to user if not present
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });

    const roleToAdd = data.category as any;
    if (user && !user.roles.includes(roleToAdd)) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          roles: { push: roleToAdd },
        },
      });
    }

    // Return subscription with payment info if required
    if (price > 0) {
      return NextResponse.json({
        subscription,
        paymentRequired: true,
        amount: price,
        currency: "GHS",
      }, { status: 201 });
    }

    return NextResponse.json({
      subscription,
      paymentRequired: false,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error creating subscription:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}

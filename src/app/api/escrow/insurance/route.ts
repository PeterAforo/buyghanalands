import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const purchaseInsuranceSchema = z.object({
  transactionId: z.string(),
  coverageLevel: z.enum(["BASIC", "STANDARD", "PREMIUM"]),
});

// Insurance coverage levels
const COVERAGE_LEVELS = {
  BASIC: {
    name: "Basic Protection",
    coveragePercent: 50,
    premiumPercent: 1.5,
    maxCoverageGhs: 100000,
    features: ["Fraud protection", "Document verification"],
  },
  STANDARD: {
    name: "Standard Protection",
    coveragePercent: 75,
    premiumPercent: 2.5,
    maxCoverageGhs: 500000,
    features: ["Fraud protection", "Document verification", "Title insurance", "Legal support"],
  },
  PREMIUM: {
    name: "Premium Protection",
    coveragePercent: 100,
    premiumPercent: 4,
    maxCoverageGhs: 2000000,
    features: ["Full fraud protection", "Document verification", "Title insurance", "Legal support", "Survey verification", "Priority claims"],
  },
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transactionId");

    if (transactionId) {
      // Get insurance for specific transaction
      const insurance = await prisma.escrowInsurance.findUnique({
        where: { transactionId },
        include: {
          claims: true,
        },
      });

      return NextResponse.json({
        insurance,
        coverageLevels: COVERAGE_LEVELS,
      });
    }

    // Get all user's insurance policies
    const insurances = await prisma.escrowInsurance.findMany({
      where: {
        transaction: {
          OR: [
            { buyerId: session.user.id },
            { sellerId: session.user.id },
          ],
        },
      },
      include: {
        transaction: {
          select: {
            id: true,
            listing: { select: { title: true } },
            agreedPriceGhs: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      insurances,
      coverageLevels: COVERAGE_LEVELS,
    });
  } catch (error) {
    console.error("Error fetching insurance:", error);
    return NextResponse.json({ error: "Failed to fetch insurance" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = purchaseInsuranceSchema.parse(body);

    // Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: data.transactionId },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        agreedPriceGhs: true,
        status: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Only buyer can purchase insurance
    if (transaction.buyerId !== session.user.id) {
      return NextResponse.json({ error: "Only buyer can purchase insurance" }, { status: 403 });
    }

    // Check if insurance already exists
    const existing = await prisma.escrowInsurance.findUnique({
      where: { transactionId: data.transactionId },
    });

    if (existing) {
      return NextResponse.json({ error: "Insurance already purchased for this transaction" }, { status: 400 });
    }

    // Calculate premium
    const coverage = COVERAGE_LEVELS[data.coverageLevel];
    const transactionAmount = Number(transaction.agreedPriceGhs);
    const premiumAmount = Math.round(transactionAmount * (coverage.premiumPercent / 100));
    const coverageAmount = Math.min(
      Math.round(transactionAmount * (coverage.coveragePercent / 100)),
      coverage.maxCoverageGhs
    );

    const insurance = await prisma.escrowInsurance.create({
      data: {
        transactionId: data.transactionId,
        buyerId: session.user.id,
        coverageLevel: data.coverageLevel,
        premiumGhs: premiumAmount,
        coverageAmountGhs: coverageAmount,
        status: "PENDING_PAYMENT",
        features: coverage.features,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
    });

    return NextResponse.json({
      insurance,
      paymentRequired: true,
      amount: premiumAmount,
      currency: "GHS",
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error purchasing insurance:", error);
    return NextResponse.json({ error: "Failed to purchase insurance" }, { status: 500 });
  }
}

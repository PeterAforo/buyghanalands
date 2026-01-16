import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const predictionRequestSchema = z.object({
  region: z.string(),
  district: z.string(),
  landType: z.enum(["RESIDENTIAL", "COMMERCIAL", "AGRICULTURAL", "MIXED"]),
  sizeAcres: z.number().min(0.1),
  tenureType: z.enum(["FREEHOLD", "LEASEHOLD", "CUSTOMARY"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription for analytics access
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
    });

    const features = subscription?.features as any;
    if (!features?.analytics) {
      return NextResponse.json({
        error: "Price prediction requires Premium subscription",
        upgradeRequired: true,
      }, { status: 403 });
    }

    const body = await request.json();
    const data = predictionRequestSchema.parse(body);

    // Get comparable listings from the same area
    const comparables = await prisma.listing.findMany({
      where: {
        status: "PUBLISHED",
        region: data.region,
        district: data.district,
        landType: data.landType,
      },
      select: {
        priceGhs: true,
        sizeAcres: true,
        tenureType: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Get completed transactions for more accurate pricing
    const transactions = await prisma.transaction.findMany({
      where: {
        status: "RELEASED",
        listing: {
          region: data.region,
          district: data.district,
          landType: data.landType,
        },
      },
      select: {
        agreedPriceGhs: true,
        createdAt: true,
        listing: {
          select: {
            sizeAcres: true,
            tenureType: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    // Calculate price prediction
    const prediction = calculatePricePrediction(data, comparables, transactions);

    // Get market trends
    const trends = await getMarketTrends(data.region, data.district, data.landType);

    // Calculate investment score
    const investmentScore = calculateInvestmentScore(prediction, trends);

    return NextResponse.json({
      prediction,
      comparablesCount: comparables.length,
      transactionsCount: transactions.length,
      trends,
      investmentScore,
      confidence: calculateConfidence(comparables.length, transactions.length),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error generating price prediction:", error);
    return NextResponse.json({ error: "Failed to generate prediction" }, { status: 500 });
  }
}

function calculatePricePrediction(
  input: { sizeAcres: number; tenureType?: string },
  comparables: any[],
  transactions: any[]
) {
  if (comparables.length === 0 && transactions.length === 0) {
    return {
      estimatedPriceGhs: 0,
      priceRangeLow: 0,
      priceRangeHigh: 0,
      pricePerAcre: 0,
      message: "Insufficient data for prediction",
    };
  }

  // Calculate price per acre from listings
  const listingPricesPerAcre = comparables
    .filter((c) => Number(c.sizeAcres) > 0)
    .map((c) => Number(c.priceGhs) / Number(c.sizeAcres));

  // Calculate price per acre from transactions (more reliable)
  const transactionPricesPerAcre = transactions
    .filter((t) => Number(t.listing.sizeAcres) > 0)
    .map((t) => Number(t.agreedPriceGhs) / Number(t.listing.sizeAcres));

  // Weight transactions more heavily (70% transactions, 30% listings)
  let avgPricePerAcre = 0;
  if (transactionPricesPerAcre.length > 0 && listingPricesPerAcre.length > 0) {
    const transactionAvg = transactionPricesPerAcre.reduce((a, b) => a + b, 0) / transactionPricesPerAcre.length;
    const listingAvg = listingPricesPerAcre.reduce((a, b) => a + b, 0) / listingPricesPerAcre.length;
    avgPricePerAcre = transactionAvg * 0.7 + listingAvg * 0.3;
  } else if (transactionPricesPerAcre.length > 0) {
    avgPricePerAcre = transactionPricesPerAcre.reduce((a, b) => a + b, 0) / transactionPricesPerAcre.length;
  } else {
    avgPricePerAcre = listingPricesPerAcre.reduce((a, b) => a + b, 0) / listingPricesPerAcre.length;
  }

  // Apply tenure type adjustment
  let tenureMultiplier = 1;
  if (input.tenureType === "LEASEHOLD") {
    tenureMultiplier = 0.7; // Leasehold typically 30% less
  } else if (input.tenureType === "CUSTOMARY") {
    tenureMultiplier = 0.85; // Customary typically 15% less
  }

  const estimatedPrice = Math.round(avgPricePerAcre * input.sizeAcres * tenureMultiplier);

  // Calculate range (±15%)
  const priceRangeLow = Math.round(estimatedPrice * 0.85);
  const priceRangeHigh = Math.round(estimatedPrice * 1.15);

  return {
    estimatedPriceGhs: estimatedPrice,
    priceRangeLow,
    priceRangeHigh,
    pricePerAcre: Math.round(avgPricePerAcre * tenureMultiplier),
  };
}

async function getMarketTrends(region: string, district: string, landType: string) {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  // Get recent listings count
  const recentListings = await prisma.listing.count({
    where: {
      region,
      district,
      landType: landType as any,
      createdAt: { gte: threeMonthsAgo },
    },
  });

  // Get older listings count for comparison
  const olderListings = await prisma.listing.count({
    where: {
      region,
      district,
      landType: landType as any,
      createdAt: { gte: sixMonthsAgo, lt: threeMonthsAgo },
    },
  });

  // Calculate supply trend
  const supplyTrend = olderListings > 0
    ? ((recentListings - olderListings) / olderListings) * 100
    : 0;

  // Get price trend
  const recentPrices = await prisma.listing.aggregate({
    where: {
      region,
      district,
      landType: landType as any,
      createdAt: { gte: threeMonthsAgo },
    },
    _avg: { priceGhs: true },
  });

  const olderPrices = await prisma.listing.aggregate({
    where: {
      region,
      district,
      landType: landType as any,
      createdAt: { gte: sixMonthsAgo, lt: threeMonthsAgo },
    },
    _avg: { priceGhs: true },
  });

  const priceTrend = olderPrices._avg.priceGhs && recentPrices._avg.priceGhs
    ? ((Number(recentPrices._avg.priceGhs) - Number(olderPrices._avg.priceGhs)) / Number(olderPrices._avg.priceGhs)) * 100
    : 0;

  return {
    supplyTrend: Math.round(supplyTrend * 10) / 10,
    priceTrend: Math.round(priceTrend * 10) / 10,
    recentListings,
    marketActivity: recentListings > 10 ? "HIGH" : recentListings > 5 ? "MEDIUM" : "LOW",
  };
}

function calculateInvestmentScore(prediction: any, trends: any) {
  let score = 50; // Base score

  // Price trend impact (+/- 20 points)
  if (trends.priceTrend > 10) score += 20;
  else if (trends.priceTrend > 5) score += 10;
  else if (trends.priceTrend < -10) score -= 20;
  else if (trends.priceTrend < -5) score -= 10;

  // Market activity impact (+/- 15 points)
  if (trends.marketActivity === "HIGH") score += 15;
  else if (trends.marketActivity === "LOW") score -= 10;

  // Supply trend impact (+/- 15 points)
  if (trends.supplyTrend < -10) score += 15; // Low supply = good for investment
  else if (trends.supplyTrend > 20) score -= 10; // High supply = more competition

  return {
    score: Math.max(0, Math.min(100, score)),
    rating: score >= 70 ? "EXCELLENT" : score >= 50 ? "GOOD" : score >= 30 ? "FAIR" : "POOR",
    factors: [
      { name: "Price Trend", impact: trends.priceTrend > 0 ? "positive" : "negative" },
      { name: "Market Activity", impact: trends.marketActivity === "HIGH" ? "positive" : "neutral" },
      { name: "Supply Level", impact: trends.supplyTrend < 0 ? "positive" : "neutral" },
    ],
  };
}

function calculateConfidence(comparablesCount: number, transactionsCount: number) {
  const total = comparablesCount + transactionsCount * 2; // Weight transactions more
  if (total >= 30) return { level: "HIGH", percentage: 85 };
  if (total >= 15) return { level: "MEDIUM", percentage: 70 };
  if (total >= 5) return { level: "LOW", percentage: 50 };
  return { level: "VERY_LOW", percentage: 30 };
}

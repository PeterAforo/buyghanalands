import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region");
    const period = searchParams.get("period") || "30d";

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
        error: "Analytics requires Premium subscription",
        upgradeRequired: true,
      }, { status: 403 });
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const where: any = {
      status: "PUBLISHED",
      createdAt: { gte: startDate },
    };
    if (region) where.region = region;

    // Get listings data
    const listings = await prisma.listing.findMany({
      where,
      select: {
        region: true,
        district: true,
        landType: true,
        priceGhs: true,
        sizeAcres: true,
        createdAt: true,
      },
    });

    // Get completed transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        status: "RELEASED",
        createdAt: { gte: startDate },
        ...(region && { listing: { region } }),
      },
      select: {
        agreedPriceGhs: true,
        createdAt: true,
        listing: {
          select: {
            region: true,
            district: true,
            landType: true,
            sizeAcres: true,
          },
        },
      },
    });

    // Calculate market statistics
    const stats = calculateMarketStats(listings, transactions);

    // Price trends by region
    const priceByRegion = calculatePriceByRegion(listings);

    // Demand heatmap data
    const demandHeatmap = calculateDemandHeatmap(listings);

    // Price per acre trends
    const pricePerAcreTrends = calculatePricePerAcreTrends(listings, startDate);

    return NextResponse.json({
      period,
      region: region || "All Regions",
      stats,
      priceByRegion,
      demandHeatmap,
      pricePerAcreTrends,
      listingsCount: listings.length,
      transactionsCount: transactions.length,
    });
  } catch (error) {
    console.error("Error generating market report:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}

function calculateMarketStats(listings: any[], transactions: any[]) {
  if (listings.length === 0) {
    return {
      avgPriceGhs: 0,
      medianPriceGhs: 0,
      avgPricePerAcre: 0,
      totalVolume: 0,
      avgTransactionValue: 0,
    };
  }

  const prices = listings.map((l) => Number(l.priceGhs)).sort((a, b) => a - b);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const medianPrice = prices[Math.floor(prices.length / 2)];

  const pricesPerAcre = listings
    .filter((l) => Number(l.sizeAcres) > 0)
    .map((l) => Number(l.priceGhs) / Number(l.sizeAcres));
  const avgPricePerAcre = pricesPerAcre.length > 0
    ? pricesPerAcre.reduce((a, b) => a + b, 0) / pricesPerAcre.length
    : 0;

  const totalVolume = transactions.reduce((sum, t) => sum + Number(t.agreedPriceGhs), 0);
  const avgTransactionValue = transactions.length > 0 ? totalVolume / transactions.length : 0;

  return {
    avgPriceGhs: Math.round(avgPrice),
    medianPriceGhs: Math.round(medianPrice),
    avgPricePerAcre: Math.round(avgPricePerAcre),
    totalVolume: Math.round(totalVolume),
    avgTransactionValue: Math.round(avgTransactionValue),
  };
}

function calculatePriceByRegion(listings: any[]) {
  const byRegion: { [key: string]: { total: number; count: number; acres: number } } = {};

  listings.forEach((l) => {
    if (!byRegion[l.region]) {
      byRegion[l.region] = { total: 0, count: 0, acres: 0 };
    }
    byRegion[l.region].total += Number(l.priceGhs);
    byRegion[l.region].count += 1;
    byRegion[l.region].acres += Number(l.sizeAcres);
  });

  return Object.entries(byRegion).map(([region, data]) => ({
    region,
    avgPrice: Math.round(data.total / data.count),
    avgPricePerAcre: data.acres > 0 ? Math.round(data.total / data.acres) : 0,
    listingsCount: data.count,
  })).sort((a, b) => b.listingsCount - a.listingsCount);
}

function calculateDemandHeatmap(listings: any[]) {
  const byDistrict: { [key: string]: number } = {};

  listings.forEach((l) => {
    const key = `${l.region}|${l.district}`;
    byDistrict[key] = (byDistrict[key] || 0) + 1;
  });

  return Object.entries(byDistrict)
    .map(([key, count]) => {
      const [region, district] = key.split("|");
      return { region, district, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

function calculatePricePerAcreTrends(listings: any[], startDate: Date) {
  const byMonth: { [key: string]: { total: number; acres: number } } = {};

  listings.forEach((l) => {
    const monthKey = l.createdAt.toISOString().substring(0, 7);
    if (!byMonth[monthKey]) {
      byMonth[monthKey] = { total: 0, acres: 0 };
    }
    byMonth[monthKey].total += Number(l.priceGhs);
    byMonth[monthKey].acres += Number(l.sizeAcres);
  });

  return Object.entries(byMonth)
    .map(([month, data]) => ({
      month,
      avgPricePerAcre: data.acres > 0 ? Math.round(data.total / data.acres) : 0,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

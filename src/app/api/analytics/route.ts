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
    const period = searchParams.get("period") || "30d";
    const type = searchParams.get("type") || "overview";

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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });
    const isAdmin = user?.roles.includes("ADMIN");

    if (type === "overview") {
      return await getOverviewAnalytics(session.user.id, isAdmin, startDate);
    } else if (type === "revenue") {
      return await getRevenueAnalytics(session.user.id, isAdmin, startDate);
    } else if (type === "listings") {
      return await getListingsAnalytics(session.user.id, isAdmin, startDate);
    } else if (type === "transactions") {
      return await getTransactionsAnalytics(session.user.id, isAdmin, startDate);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

async function getOverviewAnalytics(userId: string, isAdmin: boolean | undefined, startDate: Date) {
  const whereClause = isAdmin ? {} : { sellerId: userId };
  const transactionWhere = isAdmin ? {} : { OR: [{ buyerId: userId }, { sellerId: userId }] };

  // Get counts
  const [totalListings, activeListings, totalTransactions, completedTransactions] = await Promise.all([
    prisma.listing.count({ where: whereClause }),
    prisma.listing.count({ where: { ...whereClause, status: "PUBLISHED" } }),
    prisma.transaction.count({ where: transactionWhere }),
    prisma.transaction.count({ where: { ...transactionWhere, status: "RELEASED" } }),
  ]);

  // Get monthly data for chart
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const [listings, transactions] = await Promise.all([
      prisma.listing.count({
        where: {
          ...whereClause,
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.transaction.count({
        where: {
          ...transactionWhere,
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      }),
    ]);

    months.push({
      name: date.toLocaleDateString("en-US", { month: "short" }),
      listings,
      transactions,
    });
  }

  return NextResponse.json({
    summary: {
      totalListings,
      activeListings,
      totalTransactions,
      completedTransactions,
    },
    chartData: months,
  });
}

async function getRevenueAnalytics(userId: string, isAdmin: boolean | undefined, startDate: Date) {
  const whereClause = isAdmin 
    ? { status: "RELEASED", createdAt: { gte: startDate } }
    : { sellerId: userId, status: "RELEASED", createdAt: { gte: startDate } };

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    select: {
      agreedPriceGhs: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by month
  const monthlyRevenue: { [key: string]: number } = {};
  transactions.forEach((t) => {
    const monthKey = t.createdAt.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + Number(t.agreedPriceGhs);
  });

  const chartData = Object.entries(monthlyRevenue).map(([name, value]) => ({
    name,
    value,
  }));

  const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.agreedPriceGhs), 0);

  return NextResponse.json({
    totalRevenue,
    transactionCount: transactions.length,
    chartData,
  });
}

async function getListingsAnalytics(userId: string, isAdmin: boolean | undefined, startDate: Date) {
  const whereClause = isAdmin ? { createdAt: { gte: startDate } } : { sellerId: userId, createdAt: { gte: startDate } };

  const listings = await prisma.listing.findMany({
    where: whereClause,
    select: {
      landType: true,
      region: true,
      status: true,
      priceGhs: true,
    },
  });

  // Group by land type
  const byLandType: { [key: string]: number } = {};
  listings.forEach((l) => {
    byLandType[l.landType] = (byLandType[l.landType] || 0) + 1;
  });

  // Group by region
  const byRegion: { [key: string]: number } = {};
  listings.forEach((l) => {
    byRegion[l.region] = (byRegion[l.region] || 0) + 1;
  });

  // Group by status
  const byStatus: { [key: string]: number } = {};
  listings.forEach((l) => {
    byStatus[l.status] = (byStatus[l.status] || 0) + 1;
  });

  return NextResponse.json({
    total: listings.length,
    byLandType: Object.entries(byLandType).map(([name, value]) => ({ name, value })),
    byRegion: Object.entries(byRegion).map(([name, value]) => ({ name, value })).slice(0, 10),
    byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
  });
}

async function getTransactionsAnalytics(userId: string, isAdmin: boolean | undefined, startDate: Date) {
  const whereClause = isAdmin 
    ? { createdAt: { gte: startDate } }
    : { OR: [{ buyerId: userId }, { sellerId: userId }], createdAt: { gte: startDate } };

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    select: {
      status: true,
      agreedPriceGhs: true,
      createdAt: true,
    },
  });

  // Group by status
  const byStatus: { [key: string]: number } = {};
  transactions.forEach((t) => {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
  });

  // Calculate average transaction value
  const avgValue = transactions.length > 0
    ? transactions.reduce((sum, t) => sum + Number(t.agreedPriceGhs), 0) / transactions.length
    : 0;

  return NextResponse.json({
    total: transactions.length,
    avgValue,
    byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
  });
}

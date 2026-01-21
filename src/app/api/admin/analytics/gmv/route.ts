import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.some((role) => ["ADMIN", "FINANCE"].includes(role)) || false;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const groupBy = searchParams.get("groupBy") || "month";
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    // Get all completed transactions for the year
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const transactions = await prisma.transaction.findMany({
      where: {
        status: { in: ["RELEASED", "CLOSED"] },
        closedAt: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      select: {
        agreedPriceGhs: true,
        closedAt: true,
        listing: {
          select: { region: true, landType: true },
        },
      },
    });

    // Group by time period
    const gmvByPeriod: Record<string, number> = {};
    const countByPeriod: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (!tx.closedAt) return;

      let key: string;
      const date = new Date(tx.closedAt);

      switch (groupBy) {
        case "day":
          key = date.toISOString().split("T")[0];
          break;
        case "week":
          const weekNum = Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);
          key = `${date.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
          break;
        case "month":
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          break;
      }

      gmvByPeriod[key] = (gmvByPeriod[key] || 0) + Number(tx.agreedPriceGhs);
      countByPeriod[key] = (countByPeriod[key] || 0) + 1;
    });

    // Group by region
    const gmvByRegion: Record<string, number> = {};
    transactions.forEach((tx) => {
      const region = tx.listing?.region || "Unknown";
      gmvByRegion[region] = (gmvByRegion[region] || 0) + Number(tx.agreedPriceGhs);
    });

    // Group by land type
    const gmvByLandType: Record<string, number> = {};
    transactions.forEach((tx) => {
      const landType = tx.listing?.landType || "Unknown";
      gmvByLandType[landType] = (gmvByLandType[landType] || 0) + Number(tx.agreedPriceGhs);
    });

    // Calculate totals
    const totalGmv = transactions.reduce((sum, tx) => sum + Number(tx.agreedPriceGhs), 0);
    const avgTransactionValue = transactions.length > 0 ? totalGmv / transactions.length : 0;

    // Sort periods
    const sortedPeriods = Object.keys(gmvByPeriod).sort();
    const timeline = sortedPeriods.map((period) => ({
      period,
      gmv: gmvByPeriod[period],
      count: countByPeriod[period],
      avgValue: countByPeriod[period] > 0 ? gmvByPeriod[period] / countByPeriod[period] : 0,
    }));

    return NextResponse.json({
      year,
      groupBy,
      summary: {
        totalGmv,
        totalTransactions: transactions.length,
        avgTransactionValue: Math.round(avgTransactionValue),
      },
      timeline,
      byRegion: Object.entries(gmvByRegion)
        .map(([region, gmv]) => ({ region, gmv }))
        .sort((a, b) => b.gmv - a.gmv),
      byLandType: Object.entries(gmvByLandType)
        .map(([landType, gmv]) => ({ landType, gmv }))
        .sort((a, b) => b.gmv - a.gmv),
    });
  } catch (error) {
    console.error("Error fetching GMV analytics:", error);
    return NextResponse.json({ error: "Failed to fetch GMV analytics" }, { status: 500 });
  }
}

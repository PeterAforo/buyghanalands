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
    const period = searchParams.get("period") || "30d";

    // Calculate date range
    let startDate = new Date();
    switch (period) {
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Gather all metrics in parallel
    const [
      userStats,
      listingStats,
      transactionStats,
      paymentStats,
      verificationStats,
      disputeStats,
      recentUsers,
      recentListings,
      topRegions,
    ] = await Promise.all([
      // User statistics
      prisma.user.aggregate({
        _count: true,
        where: { createdAt: { gte: startDate } },
      }).then(async (newUsers) => ({
        total: await prisma.user.count(),
        newInPeriod: newUsers._count,
        byRole: await prisma.user.groupBy({
          by: ["roles"],
          _count: true,
        }),
        byKycTier: await prisma.user.groupBy({
          by: ["kycTier"],
          _count: true,
        }),
      })),

      // Listing statistics
      prisma.listing.aggregate({
        _count: true,
        where: { createdAt: { gte: startDate } },
      }).then(async (newListings) => ({
        total: await prisma.listing.count(),
        newInPeriod: newListings._count,
        byStatus: await prisma.listing.groupBy({
          by: ["status"],
          _count: true,
        }),
        byLandType: await prisma.listing.groupBy({
          by: ["landType"],
          _count: true,
        }),
        published: await prisma.listing.count({ where: { status: "PUBLISHED" } }),
      })),

      // Transaction statistics
      prisma.transaction.findMany({
        where: { createdAt: { gte: startDate } },
        select: { agreedPriceGhs: true, status: true },
      }).then(async (transactions) => {
        const gmv = transactions.reduce((sum, t) => sum + Number(t.agreedPriceGhs), 0);
        const completed = transactions.filter((t) => t.status === "RELEASED" || t.status === "CLOSED");
        const completedGmv = completed.reduce((sum, t) => sum + Number(t.agreedPriceGhs), 0);

        return {
          total: await prisma.transaction.count(),
          inPeriod: transactions.length,
          gmvInPeriod: gmv,
          completedInPeriod: completed.length,
          completedGmvInPeriod: completedGmv,
          byStatus: await prisma.transaction.groupBy({
            by: ["status"],
            _count: true,
          }),
        };
      }),

      // Payment statistics
      prisma.payment.findMany({
        where: {
          createdAt: { gte: startDate },
          status: "SUCCESS",
        },
        select: { amount: true, fees: true, type: true },
      }).then((payments) => {
        const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const totalFees = payments.reduce((sum, p) => sum + Number(p.fees), 0);

        return {
          totalInPeriod: payments.length,
          amountInPeriod: totalAmount,
          feesInPeriod: totalFees,
          byType: payments.reduce((acc, p) => {
            acc[p.type] = (acc[p.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        };
      }),

      // Verification statistics
      prisma.verificationRequest.groupBy({
        by: ["status"],
        _count: true,
      }),

      // Dispute statistics
      prisma.dispute.groupBy({
        by: ["status"],
        _count: true,
      }),

      // Recent users
      prisma.user.findMany({
        select: { id: true, fullName: true, roles: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // Recent listings
      prisma.listing.findMany({
        where: { status: "PUBLISHED" },
        select: {
          id: true,
          title: true,
          priceGhs: true,
          region: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // Top regions by listings
      prisma.listing.groupBy({
        by: ["region"],
        _count: true,
        where: { status: "PUBLISHED" },
        orderBy: { _count: { region: "desc" } },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      generatedAt: new Date().toISOString(),
      users: userStats,
      listings: listingStats,
      transactions: transactionStats,
      payments: paymentStats,
      verifications: verificationStats,
      disputes: disputeStats,
      recent: {
        users: recentUsers,
        listings: recentListings.map((l) => ({
          ...l,
          priceGhs: l.priceGhs.toString(),
        })),
      },
      topRegions,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// This endpoint can be called by a cron job to expire old offers
export async function POST() {
  try {
    // Verify this is a cron request (in production, add proper auth)
    const now = new Date();

    // Find and expire all offers past their expiry date
    const expiredOffers = await prisma.offer.updateMany({
      where: {
        status: { in: ["SENT", "COUNTERED"] },
        expiresAt: { lt: now },
      },
      data: {
        status: "EXPIRED",
      },
    });

    // Log the expiration
    if (expiredOffers.count > 0) {
      await prisma.auditLog.create({
        data: {
          entityType: "OFFER",
          entityId: "BATCH",
          actorType: "SYSTEM",
          action: "BATCH_EXPIRE",
          diff: { count: expiredOffers.count, expiredAt: now.toISOString() },
        },
      });
    }

    return NextResponse.json({
      message: `Expired ${expiredOffers.count} offers`,
      count: expiredOffers.count,
    });
  } catch (error) {
    console.error("Error expiring offers:", error);
    return NextResponse.json({ error: "Failed to expire offers" }, { status: 500 });
  }
}

export async function GET() {
  // Return stats about expiring offers
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const [expired, expiringIn24h, active] = await Promise.all([
      prisma.offer.count({
        where: {
          status: { in: ["SENT", "COUNTERED"] },
          expiresAt: { lt: now },
        },
      }),
      prisma.offer.count({
        where: {
          status: { in: ["SENT", "COUNTERED"] },
          expiresAt: { gte: now, lt: in24Hours },
        },
      }),
      prisma.offer.count({
        where: {
          status: { in: ["SENT", "COUNTERED"] },
          expiresAt: { gte: now },
        },
      }),
    ]);

    return NextResponse.json({
      needsExpiration: expired,
      expiringIn24Hours: expiringIn24h,
      activeOffers: active,
    });
  } catch (error) {
    console.error("Error getting offer stats:", error);
    return NextResponse.json({ error: "Failed to get offer stats" }, { status: 500 });
  }
}

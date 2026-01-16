import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { sendSMS } from "@/lib/sms";

// This endpoint should be called by a cron job to process alerts
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const frequency = searchParams.get("frequency") || "INSTANT";

    // Get active alerts for this frequency
    const alerts = await prisma.listingAlert.findMany({
      where: {
        isActive: true,
        frequency,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            fullName: true,
          },
        },
      },
    });

    let processed = 0;
    let notificationsSent = 0;

    for (const alert of alerts) {
      const criteria = alert.criteria as any;
      
      // Build query for matching listings
      const where: any = {
        status: "PUBLISHED",
        createdAt: {
          gt: alert.lastTriggeredAt || alert.createdAt,
        },
      };

      if (criteria.regions?.length > 0) {
        where.region = { in: criteria.regions };
      }
      if (criteria.landTypes?.length > 0) {
        where.landType = { in: criteria.landTypes };
      }
      if (criteria.minPrice) {
        where.priceGhs = { ...where.priceGhs, gte: criteria.minPrice };
      }
      if (criteria.maxPrice) {
        where.priceGhs = { ...where.priceGhs, lte: criteria.maxPrice };
      }
      if (criteria.minSize) {
        where.sizeAcres = { ...where.sizeAcres, gte: criteria.minSize };
      }
      if (criteria.maxSize) {
        where.sizeAcres = { ...where.sizeAcres, lte: criteria.maxSize };
      }

      // Find matching listings
      const matchingListings = await prisma.listing.findMany({
        where,
        select: {
          id: true,
          title: true,
          region: true,
          district: true,
          priceGhs: true,
          sizeAcres: true,
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      });

      if (matchingListings.length > 0) {
        // Send notifications
        if (alert.notifyEmail && alert.user.email) {
          const listingsList = matchingListings
            .map((l) => `- ${l.title} (${l.region}, GHS ${Number(l.priceGhs).toLocaleString()})`)
            .join("\n");

          await sendEmail({
            to: alert.user.email,
            subject: `${matchingListings.length} new listings match your alert "${alert.name}"`,
            html: `
              <h2>New Listings Alert</h2>
              <p>Hi ${alert.user.fullName},</p>
              <p>We found ${matchingListings.length} new listing(s) matching your alert "${alert.name}":</p>
              <pre>${listingsList}</pre>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/listings">View all listings</a></p>
            `,
          });
          notificationsSent++;
        }

        if (alert.notifySms && alert.user.phone) {
          await sendSMS(
            alert.user.phone,
            `BuyGhanaLands: ${matchingListings.length} new listings match your "${alert.name}" alert. Check your email or visit our website.`
          );
          notificationsSent++;
        }

        // Update last triggered time
        await prisma.listingAlert.update({
          where: { id: alert.id },
          data: { lastTriggeredAt: new Date() },
        });
      }

      processed++;
    }

    return NextResponse.json({
      processed,
      notificationsSent,
      frequency,
    });
  } catch (error) {
    console.error("Error processing alerts:", error);
    return NextResponse.json({ error: "Failed to process alerts" }, { status: 500 });
  }
}

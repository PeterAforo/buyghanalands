import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createAlertSchema = z.object({
  name: z.string().min(2),
  regions: z.array(z.string()).optional(),
  landTypes: z.array(z.string()).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minSize: z.number().optional(),
  maxSize: z.number().optional(),
  keywords: z.array(z.string()).optional(),
  notifyEmail: z.boolean().default(true),
  notifySms: z.boolean().default(false),
  frequency: z.enum(["INSTANT", "DAILY", "WEEKLY"]).default("INSTANT"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alerts = await prisma.listingAlert.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createAlertSchema.parse(body);

    // Check subscription limits
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
    });

    const features = subscription?.features as any;
    const alertLimit = features?.instantAlerts || 3; // Default 3 for free users

    if (alertLimit !== -1) {
      const existingCount = await prisma.listingAlert.count({
        where: { userId: session.user.id, isActive: true },
      });

      if (existingCount >= alertLimit) {
        return NextResponse.json({
          error: `Alert limit reached (${alertLimit}). Upgrade your plan for more alerts.`,
        }, { status: 400 });
      }
    }

    const alert = await prisma.listingAlert.create({
      data: {
        userId: session.user.id,
        name: data.name,
        criteria: {
          regions: data.regions,
          landTypes: data.landTypes,
          minPrice: data.minPrice,
          maxPrice: data.maxPrice,
          minSize: data.minSize,
          maxSize: data.maxSize,
          keywords: data.keywords,
        },
        notifyEmail: data.notifyEmail,
        notifySms: data.notifySms,
        frequency: data.frequency,
        isActive: true,
      },
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error creating alert:", error);
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  }
}

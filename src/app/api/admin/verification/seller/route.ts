import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });

    if (!user?.roles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {
      type: "SELLER_VERIFICATION",
    };
    if (status) where.status = status;

    const requests = await prisma.verificationRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            kycTier: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching verification requests:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

const reviewSchema = z.object({
  requestId: z.string(),
  action: z.enum(["APPROVE", "REJECT", "REQUEST_INFO"]),
  note: z.string().optional(),
  badgeLevel: z.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });

    if (!user?.roles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data = reviewSchema.parse(body);

    const verificationRequest = await prisma.verificationRequest.findUnique({
      where: { id: data.requestId },
    });

    if (!verificationRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (data.action === "APPROVE") {
      // Update verification request
      await prisma.verificationRequest.update({
        where: { id: data.requestId },
        data: {
          status: "COMPLETED",
          assignedToId: session.user.id,
          completedAt: new Date(),
          outcomeNotes: data.note,
        },
      });

      // Create or update seller badge
      await prisma.sellerBadge.upsert({
        where: { userId: verificationRequest.userId },
        create: {
          userId: verificationRequest.userId,
          level: data.badgeLevel || "BRONZE",
          status: "ACTIVE",
          issuedAt: new Date(),
          issuedById: session.user.id,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
        update: {
          level: data.badgeLevel || "BRONZE",
          status: "ACTIVE",
          issuedAt: new Date(),
          issuedById: session.user.id,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      // Update user KYC tier
      await prisma.user.update({
        where: { id: verificationRequest.userId },
        data: { kycTier: "TIER_2_GHANA_CARD" },
      });

    } else if (data.action === "REJECT") {
      await prisma.verificationRequest.update({
        where: { id: data.requestId },
        data: {
          status: "REJECTED",
          assignedToId: session.user.id,
          completedAt: new Date(),
          outcomeNotes: data.note,
        },
      });

    } else if (data.action === "REQUEST_INFO") {
      await prisma.verificationRequest.update({
        where: { id: data.requestId },
        data: {
          status: "PENDING",
          outcomeNotes: data.note,
        },
      });
    }

    return NextResponse.json({ success: true, action: data.action });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error reviewing verification:", error);
    return NextResponse.json({ error: "Failed to review verification" }, { status: 500 });
  }
}

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

    // Users can only see their own reports
    const reports = await prisma.report.findMany({
      where: { reporterId: session.user.id },
      include: {
        listing: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

const createReportSchema = z.object({
  targetType: z.enum(["LISTING", "USER", "MESSAGE", "TRANSACTION"]),
  targetId: z.string(),
  reason: z.enum([
    "FRAUD",
    "FAKE_LISTING",
    "DUPLICATE",
    "INAPPROPRIATE_CONTENT",
    "HARASSMENT",
    "SPAM",
    "PRICE_MANIPULATION",
    "IDENTITY_THEFT",
    "OTHER",
  ]),
  details: z.string().min(10).max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createReportSchema.parse(body);

    // Verify target exists
    let listingId: string | null = null;

    switch (data.targetType) {
      case "LISTING":
        const listing = await prisma.listing.findUnique({
          where: { id: data.targetId },
          select: { id: true, sellerId: true },
        });
        if (!listing) {
          return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        }
        if (listing.sellerId === session.user.id) {
          return NextResponse.json({ error: "Cannot report your own listing" }, { status: 400 });
        }
        listingId = listing.id;
        break;

      case "USER":
        const user = await prisma.user.findUnique({
          where: { id: data.targetId },
          select: { id: true },
        });
        if (!user) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        if (user.id === session.user.id) {
          return NextResponse.json({ error: "Cannot report yourself" }, { status: 400 });
        }
        break;

      case "MESSAGE":
        const message = await prisma.message.findUnique({
          where: { id: data.targetId },
          select: { id: true, senderId: true, receiverId: true },
        });
        if (!message) {
          return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }
        if (message.senderId !== session.user.id && message.receiverId !== session.user.id) {
          return NextResponse.json({ error: "Cannot report this message" }, { status: 403 });
        }
        break;

      case "TRANSACTION":
        const transaction = await prisma.transaction.findUnique({
          where: { id: data.targetId },
          select: { id: true, buyerId: true, sellerId: true },
        });
        if (!transaction) {
          return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }
        if (transaction.buyerId !== session.user.id && transaction.sellerId !== session.user.id) {
          return NextResponse.json({ error: "Cannot report this transaction" }, { status: 403 });
        }
        break;
    }

    // Check for duplicate reports
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: session.user.id,
        targetType: data.targetType,
        targetId: data.targetId,
        status: { in: ["OPEN", "IN_REVIEW"] },
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: "You have already reported this item" },
        { status: 400 }
      );
    }

    const report = await prisma.report.create({
      data: {
        reporterId: session.user.id,
        targetType: data.targetType,
        targetId: data.targetId,
        listingId,
        reason: data.reason,
        details: data.details,
        status: "OPEN",
      },
    });

    // Auto-flag if multiple reports on same target
    const reportCount = await prisma.report.count({
      where: {
        targetType: data.targetType,
        targetId: data.targetId,
        status: { in: ["OPEN", "IN_REVIEW"] },
      },
    });

    if (reportCount >= 3) {
      // Create fraud case for investigation
      await prisma.fraudCase.create({
        data: {
          openedById: session.user.id,
          listingId: data.targetType === "LISTING" ? data.targetId : null,
          userId: data.targetType === "USER" ? data.targetId : null,
          status: "OPEN",
          summary: `Auto-flagged: ${reportCount} reports received for ${data.targetType} ${data.targetId}`,
          evidence: { reportIds: [report.id], reportCount },
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "REPORT",
        entityId: report.id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "CREATE",
        diff: { targetType: data.targetType, targetId: data.targetId, reason: data.reason },
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating report:", error);
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function isCompliance(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.some((role) => ["ADMIN", "COMPLIANCE", "MODERATOR"].includes(role)) || false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isCompliance(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const fraudCase = await prisma.fraudCase.findUnique({
      where: { id },
      include: {
        openedBy: { select: { id: true, fullName: true } },
        listing: {
          include: {
            seller: { select: { id: true, fullName: true, phone: true, kycTier: true } },
            media: { take: 3 },
            documents: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            accountStatus: true,
            kycTier: true,
            createdAt: true,
            _count: {
              select: {
                listings: true,
                transactionsAsBuyer: true,
                transactionsAsSeller: true,
                reportsFiled: true,
              },
            },
          },
        },
      },
    });

    if (!fraudCase) {
      return NextResponse.json({ error: "Fraud case not found" }, { status: 404 });
    }

    // Get related reports
    const relatedReports = await prisma.report.findMany({
      where: {
        OR: [
          { targetType: "LISTING", targetId: fraudCase.listingId || "" },
          { targetType: "USER", targetId: fraudCase.userId || "" },
        ],
      },
      include: {
        reporter: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      ...fraudCase,
      listing: fraudCase.listing ? {
        ...fraudCase.listing,
        priceGhs: fraudCase.listing.priceGhs.toString(),
        sizeAcres: fraudCase.listing.sizeAcres.toString(),
      } : null,
      relatedReports,
    });
  } catch (error) {
    console.error("Error fetching fraud case:", error);
    return NextResponse.json({ error: "Failed to fetch fraud case" }, { status: 500 });
  }
}

const updateFraudCaseSchema = z.object({
  status: z.enum(["OPEN", "INVESTIGATING", "ACTION_TAKEN", "CLOSED"]).optional(),
  actionTaken: z.string().optional(),
  evidence: z.any().optional(),
  suspendListing: z.boolean().optional(),
  suspendUser: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isCompliance(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateFraudCaseSchema.parse(body);

    const fraudCase = await prisma.fraudCase.findUnique({
      where: { id },
      select: { id: true, status: true, listingId: true, userId: true },
    });

    if (!fraudCase) {
      return NextResponse.json({ error: "Fraud case not found" }, { status: 404 });
    }

    // Update fraud case
    const updated = await prisma.fraudCase.update({
      where: { id },
      data: {
        status: data.status,
        actionTaken: data.actionTaken,
        evidence: data.evidence,
        closedAt: data.status === "CLOSED" ? new Date() : undefined,
      },
    });

    // Suspend listing if requested
    if (data.suspendListing && fraudCase.listingId) {
      await prisma.listing.update({
        where: { id: fraudCase.listingId },
        data: { status: "SUSPENDED" },
      });
    }

    // Suspend user if requested
    if (data.suspendUser && fraudCase.userId) {
      await prisma.user.update({
        where: { id: fraudCase.userId },
        data: { accountStatus: "SUSPENDED" },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "FRAUD_CASE",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "UPDATE",
        diff: {
          previousStatus: fraudCase.status,
          newStatus: data.status,
          actionTaken: data.actionTaken,
          suspendListing: data.suspendListing,
          suspendUser: data.suspendUser,
        },
      },
    });

    return NextResponse.json({
      message: "Fraud case updated",
      fraudCase: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating fraud case:", error);
    return NextResponse.json({ error: "Failed to update fraud case" }, { status: 500 });
  }
}

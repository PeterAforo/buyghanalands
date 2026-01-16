import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.some((role) => ["ADMIN", "SUPPORT", "MODERATOR"].includes(role)) || false;
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

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        raisedBy: { select: { id: true, fullName: true } },
        transaction: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                media: { take: 1 },
              },
            },
            buyer: { select: { id: true, fullName: true, phone: true } },
            seller: { select: { id: true, fullName: true, phone: true } },
          },
        },
        messages: {
          include: {
            sender: { select: { fullName: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...dispute,
      transaction: {
        ...dispute.transaction,
        agreedPriceGhs: dispute.transaction.agreedPriceGhs.toString(),
      },
    });
  } catch (error) {
    console.error("Error fetching dispute:", error);
    return NextResponse.json({ error: "Failed to fetch dispute" }, { status: 500 });
  }
}

type DisputeStatusType = "OPEN" | "UNDER_REVIEW" | "RESOLVED_BUYER" | "RESOLVED_SELLER" | "RESOLVED_SPLIT" | "CLOSED";

const updateDisputeSchema = z.object({
  status: z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED_BUYER", "RESOLVED_SELLER", "RESOLVED_SPLIT", "CLOSED"]).optional(),
  resolution: z.string().optional(),
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

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateDisputeSchema.parse(body);

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: { transaction: true },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (data.status) {
      updateData.status = data.status;

      // Set resolved date if resolving
      if (["RESOLVED_BUYER", "RESOLVED_SELLER", "RESOLVED_SPLIT", "CLOSED"].includes(data.status)) {
        updateData.resolvedAt = new Date();
        updateData.resolvedById = session.user.id;
      }
    }

    if (data.resolution) {
      updateData.resolution = data.resolution;
    }

    const updatedDispute = await prisma.dispute.update({
      where: { id },
      data: updateData,
      include: {
        raisedBy: { select: { id: true, fullName: true } },
        transaction: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                media: { take: 1 },
              },
            },
            buyer: { select: { id: true, fullName: true, phone: true } },
            seller: { select: { id: true, fullName: true, phone: true } },
          },
        },
        messages: {
          include: {
            sender: { select: { fullName: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Update transaction status based on resolution
    if (data.status === "RESOLVED_BUYER") {
      await prisma.transaction.update({
        where: { id: dispute.transactionId },
        data: { status: "REFUNDED", closedAt: new Date() },
      });
    } else if (data.status === "RESOLVED_SELLER") {
      await prisma.transaction.update({
        where: { id: dispute.transactionId },
        data: { status: "RELEASED", closedAt: new Date() },
      });
    } else if (data.status === "RESOLVED_SPLIT") {
      await prisma.transaction.update({
        where: { id: dispute.transactionId },
        data: { status: "PARTIAL_SETTLED", closedAt: new Date() },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "DISPUTE",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: data.status ? `STATUS_CHANGE_${data.status}` : "UPDATE",
        diff: { status: data.status, resolution: data.resolution },
      },
    });

    return NextResponse.json({
      ...updatedDispute,
      transaction: {
        ...updatedDispute.transaction,
        agreedPriceGhs: updatedDispute.transaction.agreedPriceGhs.toString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating dispute:", error);
    return NextResponse.json({ error: "Failed to update dispute" }, { status: 500 });
  }
}

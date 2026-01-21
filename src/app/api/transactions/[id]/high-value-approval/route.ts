import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// High-value transaction threshold (GH₵500,000)
const HIGH_VALUE_THRESHOLD = 500000;

async function isFinanceOrAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.some((role) => ["ADMIN", "FINANCE"].includes(role)) || false;
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

    const { id } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      select: {
        id: true,
        agreedPriceGhs: true,
        status: true,
        buyerId: true,
        sellerId: true,
        milestones: {
          where: { requiresAdminApproval: true },
          select: {
            id: true,
            name: true,
            adminApprovedAt: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const isHighValue = Number(transaction.agreedPriceGhs) >= HIGH_VALUE_THRESHOLD;
    const requiresApproval = isHighValue && transaction.status === "READY_TO_RELEASE";
    const pendingMilestones = transaction.milestones.filter((m) => !m.adminApprovedAt);

    return NextResponse.json({
      transactionId: id,
      isHighValue,
      threshold: HIGH_VALUE_THRESHOLD,
      amount: transaction.agreedPriceGhs.toString(),
      requiresApproval,
      pendingAdminApprovals: pendingMilestones.length,
      milestones: transaction.milestones,
    });
  } catch (error) {
    console.error("Error checking high-value status:", error);
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }
}

const approvalSchema = z.object({
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional(),
  milestoneId: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isFinanceOrAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden - Finance/Admin only" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = approvalSchema.parse(body);

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        milestones: true,
        listing: { select: { title: true } },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const isHighValue = Number(transaction.agreedPriceGhs) >= HIGH_VALUE_THRESHOLD;
    if (!isHighValue) {
      return NextResponse.json({ error: "Not a high-value transaction" }, { status: 400 });
    }

    if (data.milestoneId) {
      // Approve specific milestone
      const milestone = transaction.milestones.find((m) => m.id === data.milestoneId);
      if (!milestone) {
        return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
      }

      if (data.action === "approve") {
        await prisma.escrowMilestone.update({
          where: { id: data.milestoneId },
          data: { adminApprovedAt: new Date() },
        });
      }
    } else {
      // Approve/reject entire transaction release
      if (transaction.status !== "READY_TO_RELEASE") {
        return NextResponse.json({ error: "Transaction not ready for release" }, { status: 400 });
      }

      if (data.action === "approve") {
        // Approve all pending milestones
        await prisma.escrowMilestone.updateMany({
          where: {
            transactionId: id,
            requiresAdminApproval: true,
            adminApprovedAt: null,
          },
          data: { adminApprovedAt: new Date() },
        });

        // Update transaction status
        await prisma.transaction.update({
          where: { id },
          data: { status: "RELEASED", closedAt: new Date() },
        });
      } else {
        // Reject - move back to disputed
        await prisma.transaction.update({
          where: { id },
          data: { status: "DISPUTED" },
        });

        // Create dispute record
        await prisma.dispute.create({
          data: {
            transactionId: id,
            raisedById: session.user.id,
            status: "OPEN",
            summary: `High-value transaction release rejected by admin: ${data.notes || "No reason provided"}`,
          },
        });
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "TRANSACTION",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: `HIGH_VALUE_${data.action.toUpperCase()}`,
        diff: {
          amount: Number(transaction.agreedPriceGhs),
          milestoneId: data.milestoneId,
          notes: data.notes,
        },
      },
    });

    return NextResponse.json({
      message: `High-value transaction ${data.action}ed`,
      transactionId: id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error processing high-value approval:", error);
    return NextResponse.json({ error: "Failed to process approval" }, { status: 500 });
  }
}

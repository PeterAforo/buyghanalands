import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: transactionId, milestoneId } = await params;
    const body = await request.json();

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const isBuyer = transaction.buyerId === session.user.id;
    const isSeller = transaction.sellerId === session.user.id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const milestone = await prisma.escrowMilestone.findUnique({
      where: { id: milestoneId },
    });

    if (!milestone || milestone.transactionId !== transactionId) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    if (body.approve) {
      const updateData: Record<string, Date> = {};

      if (isBuyer && !milestone.buyerApprovedAt) {
        updateData.buyerApprovedAt = new Date();
      }

      if (isSeller && !milestone.sellerApprovedAt) {
        updateData.sellerApprovedAt = new Date();
      }

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: "Already approved" }, { status: 400 });
      }

      const updatedMilestone = await prisma.escrowMilestone.update({
        where: { id: milestoneId },
        data: updateData,
      });

      // Check if both parties approved
      const buyerApproved = updatedMilestone.buyerApprovedAt || (isBuyer ? new Date() : null);
      const sellerApproved = updatedMilestone.sellerApprovedAt || (isSeller ? new Date() : null);

      if (buyerApproved && sellerApproved && !updatedMilestone.completedAt) {
        await prisma.escrowMilestone.update({
          where: { id: milestoneId },
          data: { completedAt: new Date() },
        });
      }

      // Check if all milestones are completed
      const allMilestones = await prisma.escrowMilestone.findMany({
        where: { transactionId },
      });

      const allCompleted = allMilestones.every((m) => {
        if (m.id === milestoneId) {
          return buyerApproved && sellerApproved;
        }
        return m.completedAt !== null;
      });

      if (allCompleted && transaction.status === "VERIFICATION_PERIOD") {
        await prisma.transaction.update({
          where: { id: transactionId },
          data: { status: "READY_TO_RELEASE" },
        });

        await prisma.auditLog.create({
          data: {
            entityType: "TRANSACTION",
            entityId: transactionId,
            actorType: "SYSTEM",
            action: "STATUS_CHANGE",
            diff: { from: "VERIFICATION_PERIOD", to: "READY_TO_RELEASE" },
          },
        });
      }

      const finalMilestone = await prisma.escrowMilestone.findUnique({
        where: { id: milestoneId },
      });

      return NextResponse.json({
        ...finalMilestone,
        amountGhs: finalMilestone?.amountGhs.toString(),
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating milestone:", error);
    return NextResponse.json({ error: "Failed to update milestone" }, { status: 500 });
  }
}

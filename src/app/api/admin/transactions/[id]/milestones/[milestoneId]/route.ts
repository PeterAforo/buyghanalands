import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await withDbRetry(() =>
    prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    })
  );
  return user?.roles.some((r) => ["ADMIN", "SUPPORT", "MODERATOR"].includes(r)) || false;
}

// PUT — admin approve or reject an individual escrow milestone
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: transactionId, milestoneId } = await params;
    const body = await request.json();
    const { action } = body as { action: "approve" | "reject" };

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
    }

    const transaction = await withDbRetry(() =>
      prisma.transaction.findUnique({
        where: { id: transactionId },
        select: { id: true, status: true },
      })
    );

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const milestone = await withDbRetry(() =>
      prisma.escrowMilestone.findUnique({
        where: { id: milestoneId },
      })
    );

    if (!milestone || milestone.transactionId !== transactionId) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    if (action === "approve") {
      if (milestone.adminApprovedAt) {
        return NextResponse.json({ error: "Milestone already approved by admin" }, { status: 400 });
      }

      const updatedMilestone = await withDbRetry(() =>
        prisma.escrowMilestone.update({
          where: { id: milestoneId },
          data: { adminApprovedAt: new Date() },
        })
      );

      // Check if all milestones are now fully approved
      const allMilestones = await withDbRetry(() =>
        prisma.escrowMilestone.findMany({
          where: { transactionId },
        })
      );

      const allApproved = allMilestones.every((m) => {
        const buyerOk = !!m.buyerApprovedAt || !m.requiresBuyerApproval;
        const sellerOk = !!m.sellerApprovedAt || !m.requiresSellerApproval;
        const adminOk = !!m.adminApprovedAt || !m.requiresAdminApproval;
        return buyerOk && sellerOk && adminOk;
      });

      // Auto-transition to READY_TO_RELEASE if all milestones approved and currently in verification/funded
      if (allApproved && ["FUNDED", "VERIFICATION_PERIOD"].includes(transaction.status)) {
        await withDbRetry(() =>
          prisma.transaction.update({
            where: { id: transactionId },
            data: { status: "READY_TO_RELEASE" },
          })
        );

        await withDbRetry(() =>
          prisma.auditLog.create({
            data: {
              entityType: "TRANSACTION",
              entityId: transactionId,
              actorType: "SYSTEM",
              action: "STATUS_CHANGE",
              diff: { from: transaction.status, to: "READY_TO_RELEASE", reason: "All milestones approved" },
            },
          })
        );
      }

      await withDbRetry(() =>
        prisma.auditLog.create({
          data: {
            entityType: "TRANSACTION",
            entityId: transactionId,
            actorType: "USER",
            actorUserId: session.user.id,
            action: "MILESTONE_ADMIN_APPROVED",
            diff: { milestoneId, milestoneName: milestone.name },
          },
        })
      );

      return NextResponse.json(serializeForJson(updatedMilestone));
    } else {
      // Reject — mark as not completed, log the rejection
      await withDbRetry(() =>
        prisma.escrowMilestone.update({
          where: { id: milestoneId },
          data: { adminApprovedAt: null },
        })
      );

      await withDbRetry(() =>
        prisma.auditLog.create({
          data: {
            entityType: "TRANSACTION",
            entityId: transactionId,
            actorType: "USER",
            actorUserId: session.user.id,
            action: "MILESTONE_ADMIN_REJECTED",
            diff: { milestoneId, milestoneName: milestone.name },
          },
        })
      );

      return NextResponse.json({ message: "Milestone rejected", milestoneId });
    }
  } catch (error) {
    console.error("Error in admin milestone approval:", error);
    return NextResponse.json({ error: "Failed to update milestone" }, { status: 500 });
  }
}

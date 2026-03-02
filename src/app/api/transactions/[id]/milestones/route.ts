import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const approveMilestoneSchema = z.object({
  milestoneId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  note: z.string().optional(),
});

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
        buyerId: true,
        sellerId: true,
        status: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (transaction.buyerId !== session.user.id && transaction.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const milestones = await prisma.escrowMilestone.findMany({
      where: { transactionId: id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      milestones: milestones.map((m) => ({
        ...m,
        amountGhs: m.amountGhs.toString(),
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch milestones" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = approveMilestoneSchema.parse(body);

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        status: true,
        agreedPriceGhs: true,
        listing: { select: { title: true } },
      },
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
      where: { id: data.milestoneId },
    });

    if (!milestone || milestone.transactionId !== id) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    if (milestone.completedAt) {
      return NextResponse.json({ error: "Milestone already completed" }, { status: 400 });
    }

    // Update approval based on role
    const updateData: any = {};
    
    if (isBuyer && milestone.requiresBuyerApproval) {
      updateData.buyerApprovedAt = data.action === "approve" ? new Date() : null;
    }
    
    if (isSeller && milestone.requiresSellerApproval) {
      updateData.sellerApprovedAt = data.action === "approve" ? new Date() : null;
    }

    const updatedMilestone = await prisma.escrowMilestone.update({
      where: { id: data.milestoneId },
      data: updateData,
    });

    // Check if all required approvals are met
    const allApproved = 
      (!updatedMilestone.requiresBuyerApproval || updatedMilestone.buyerApprovedAt) &&
      (!updatedMilestone.requiresSellerApproval || updatedMilestone.sellerApprovedAt) &&
      (!updatedMilestone.requiresAdminApproval || updatedMilestone.adminApprovedAt);

    if (allApproved && data.action === "approve") {
      await prisma.escrowMilestone.update({
        where: { id: data.milestoneId },
        data: { completedAt: new Date() },
      });

      // Check if all milestones are completed
      const allMilestones = await prisma.escrowMilestone.findMany({
        where: { transactionId: id },
      });

      const allCompleted = allMilestones.every((m) => m.completedAt);

      if (allCompleted && transaction.status === "VERIFICATION_PERIOD") {
        // Auto-transition to READY_TO_RELEASE
        await prisma.transaction.update({
          where: { id },
          data: { status: "READY_TO_RELEASE" },
        });

        await prisma.auditLog.create({
          data: {
            entityType: "TRANSACTION",
            entityId: id,
            actorType: "SYSTEM",
            action: "STATUS_CHANGE",
            diff: { from: "VERIFICATION_PERIOD", to: "READY_TO_RELEASE", reason: "all_milestones_completed" },
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
        action: `MILESTONE_${data.action.toUpperCase()}`,
        diff: {
          milestoneId: data.milestoneId,
          milestoneName: milestone.name,
          role: isBuyer ? "buyer" : "seller",
          note: data.note,
        },
      },
    });

    return NextResponse.json({
      success: true,
      milestone: {
        ...updatedMilestone,
        amountGhs: updatedMilestone.amountGhs.toString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update milestone" }, { status: 500 });
  }
}

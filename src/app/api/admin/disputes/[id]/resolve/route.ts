import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyTransactionRefunded, notifyTransactionReleased } from "@/lib/notifications";

async function isDisputeResolver(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.some((role) => ["ADMIN", "SUPPORT", "COMPLIANCE"].includes(role)) || false;
}

const resolveSchema = z.object({
  outcome: z.enum(["RELEASE", "REFUND", "PARTIAL", "TERMINATE"]),
  resolutionNotes: z.string().min(10),
  buyerAmount: z.number().optional(),
  sellerAmount: z.number().optional(),
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

    if (!(await isDisputeResolver(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = resolveSchema.parse(body);

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        transaction: {
          include: {
            listing: { select: { id: true, title: true } },
            buyer: { select: { id: true, fullName: true } },
            seller: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    if (["RESOLVED", "CLOSED"].includes(dispute.status)) {
      return NextResponse.json({ error: "Dispute already resolved" }, { status: 400 });
    }

    // Validate partial settlement amounts
    if (data.outcome === "PARTIAL") {
      if (data.buyerAmount === undefined || data.sellerAmount === undefined) {
        return NextResponse.json(
          { error: "Partial settlement requires buyerAmount and sellerAmount" },
          { status: 400 }
        );
      }
      const totalAmount = Number(dispute.transaction.agreedPriceGhs);
      if (data.buyerAmount + data.sellerAmount !== totalAmount) {
        return NextResponse.json(
          { error: `Amounts must total ${totalAmount}` },
          { status: 400 }
        );
      }
    }

    // Update dispute
    const updatedDispute = await prisma.dispute.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolutionOutcome: data.outcome,
        resolutionNotes: data.resolutionNotes,
        resolvedAt: new Date(),
        platformReviewedAt: new Date(),
      },
    });

    // Update transaction status based on outcome
    let transactionStatus: string;
    switch (data.outcome) {
      case "RELEASE":
        transactionStatus = "RELEASED";
        break;
      case "REFUND":
        transactionStatus = "REFUNDED";
        break;
      case "PARTIAL":
        transactionStatus = "PARTIAL_SETTLED";
        break;
      case "TERMINATE":
        transactionStatus = "CLOSED";
        break;
      default:
        transactionStatus = "CLOSED";
    }

    await prisma.transaction.update({
      where: { id: dispute.transactionId },
      data: {
        status: transactionStatus as any,
        closedAt: new Date(),
      },
    });

    // Send notifications
    const listingTitle = dispute.transaction.listing.title;
    const amount = Number(dispute.transaction.agreedPriceGhs);

    if (data.outcome === "RELEASE") {
      notifyTransactionReleased(dispute.transaction.sellerId, listingTitle, amount).catch(console.error);
    } else if (data.outcome === "REFUND") {
      notifyTransactionRefunded(dispute.transaction.buyerId, listingTitle, amount).catch(console.error);
    } else if (data.outcome === "PARTIAL") {
      // Notify both parties
      notifyTransactionRefunded(dispute.transaction.buyerId, listingTitle, data.buyerAmount!).catch(console.error);
      notifyTransactionReleased(dispute.transaction.sellerId, listingTitle, data.sellerAmount!).catch(console.error);
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "DISPUTE",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "RESOLVE",
        diff: {
          outcome: data.outcome,
          resolutionNotes: data.resolutionNotes,
          buyerAmount: data.buyerAmount,
          sellerAmount: data.sellerAmount,
          transactionStatus,
        },
      },
    });

    return NextResponse.json({
      message: "Dispute resolved successfully",
      dispute: updatedDispute,
      transactionStatus,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error resolving dispute:", error);
    return NextResponse.json({ error: "Failed to resolve dispute" }, { status: 500 });
  }
}

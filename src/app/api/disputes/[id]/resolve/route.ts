import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyDisputeResolved } from "@/lib/notifications";
import { calculateTransactionFees, createTransactionServiceCharges, markChargesCollected } from "@/lib/fees";

const resolveDisputeSchema = z.object({
  outcome: z.enum(["RELEASE", "REFUND", "PARTIAL", "TERMINATE"]),
  resolutionNotes: z.string().min(10, "Resolution notes required"),
  partialBuyerAmount: z.number().optional(),
  partialSellerAmount: z.number().optional(),
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

    const { id } = await params;
    const body = await request.json();
    const data = resolveDisputeSchema.parse(body);

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });

    const isAdmin = user?.roles.some((r) => ["ADMIN", "SUPPORT", "COMPLIANCE"].includes(r));
    if (!isAdmin) {
      return NextResponse.json({ error: "Only admins can resolve disputes" }, { status: 403 });
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        transaction: {
          include: {
            listing: { select: { id: true, title: true } },
            buyer: { select: { id: true, fullName: true, email: true } },
            seller: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    if (dispute.status === "RESOLVED" || dispute.status === "CLOSED") {
      return NextResponse.json({ error: "Dispute already resolved" }, { status: 400 });
    }

    const transaction = dispute.transaction;

    // Determine new transaction status based on outcome
    let newTransactionStatus: string;
    switch (data.outcome) {
      case "RELEASE":
        newTransactionStatus = "RELEASED";
        break;
      case "REFUND":
        newTransactionStatus = "REFUNDED";
        break;
      case "PARTIAL":
        newTransactionStatus = "PARTIAL_SETTLED";
        break;
      case "TERMINATE":
        newTransactionStatus = "CLOSED";
        break;
      default:
        newTransactionStatus = "CLOSED";
    }

    // Update dispute
    const updatedDispute = await prisma.dispute.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolutionOutcome: data.outcome,
        resolutionNotes: data.resolutionNotes,
        resolvedAt: new Date(),
      },
    });

    // Update transaction
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: newTransactionStatus as any,
        closedAt: new Date(),
      },
    });

    // Handle payments based on outcome
    if (data.outcome === "RELEASE") {
      // Release funds to seller (same as normal release)
      const fees = await calculateTransactionFees(
        transaction.sellerId,
        transaction.agreedPriceGhs
      );

      await createTransactionServiceCharges(
        transaction.id,
        transaction.sellerId,
        transaction.agreedPriceGhs
      );

      await markChargesCollected(transaction.id);

      await prisma.payment.create({
        data: {
          transactionId: transaction.id,
          provider: "FLUTTERWAVE",
          type: "PAYOUT",
          status: "PENDING",
          amount: fees.sellerNetAmount,
          fees: fees.sellerFeeAmount,
          netAmount: fees.sellerNetAmount,
          payeeUserId: transaction.sellerId,
        },
      });

      // Update listing to SOLD
      await prisma.listing.update({
        where: { id: transaction.listingId },
        data: { status: "SOLD" },
      });
    } else if (data.outcome === "REFUND") {
      // Full refund to buyer
      await prisma.payment.create({
        data: {
          transactionId: transaction.id,
          provider: "FLUTTERWAVE",
          type: "REFUND",
          status: "PENDING",
          amount: transaction.agreedPriceGhs,
          netAmount: transaction.agreedPriceGhs,
          payeeUserId: transaction.buyerId,
        },
      });

      // Re-publish listing
      await prisma.listing.update({
        where: { id: transaction.listingId },
        data: { status: "PUBLISHED" },
      });
    } else if (data.outcome === "PARTIAL") {
      // Partial settlement
      const buyerAmount = BigInt(Math.round((data.partialBuyerAmount || 0) * 100));
      const sellerAmount = BigInt(Math.round((data.partialSellerAmount || 0) * 100));

      if (buyerAmount > 0) {
        await prisma.payment.create({
          data: {
            transactionId: transaction.id,
            provider: "FLUTTERWAVE",
            type: "REFUND",
            status: "PENDING",
            amount: buyerAmount,
            netAmount: buyerAmount,
            payeeUserId: transaction.buyerId,
          },
        });
      }

      if (sellerAmount > 0) {
        await prisma.payment.create({
          data: {
            transactionId: transaction.id,
            provider: "FLUTTERWAVE",
            type: "PAYOUT",
            status: "PENDING",
            amount: sellerAmount,
            netAmount: sellerAmount,
            payeeUserId: transaction.sellerId,
          },
        });
      }

      // Re-publish listing
      await prisma.listing.update({
        where: { id: transaction.listingId },
        data: { status: "PUBLISHED" },
      });
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
          transactionStatus: newTransactionStatus,
          notes: data.resolutionNotes,
        },
      },
    });

    // Notify both parties
    const message = `Your dispute for "${transaction.listing.title}" has been resolved. Outcome: ${data.outcome}`;
    
    notifyDisputeResolved(transaction.buyerId, transaction.listing.title, data.outcome).catch(() => {});
    notifyDisputeResolved(transaction.sellerId, transaction.listing.title, data.outcome).catch(() => {});

    return NextResponse.json({
      success: true,
      dispute: updatedDispute,
      transactionStatus: newTransactionStatus,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to resolve dispute" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyTransactionDisputed, notifyTransactionReleased } from "@/lib/notifications";
import { calculateTransactionFees, createTransactionServiceCharges, markChargesCollected } from "@/lib/fees";

const VALID_TRANSITIONS: Record<string, string[]> = {
  CREATED: ["ESCROW_REQUESTED"],
  ESCROW_REQUESTED: ["FUNDED"],
  FUNDED: ["VERIFICATION_PERIOD"],
  VERIFICATION_PERIOD: ["READY_TO_RELEASE", "DISPUTED"],
  DISPUTED: ["READY_TO_RELEASE", "REFUNDED", "PARTIAL_SETTLED"],
  READY_TO_RELEASE: ["RELEASED"],
  RELEASED: ["CLOSED"],
  REFUNDED: ["CLOSED"],
  PARTIAL_SETTLED: ["CLOSED"],
};

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
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            town: true,
            district: true,
            region: true,
            media: { take: 1 },
          },
        },
        buyer: { select: { id: true, fullName: true, phone: true } },
        seller: { select: { id: true, fullName: true, phone: true } },
        milestones: { orderBy: { sortOrder: "asc" } },
        payments: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Check authorization
    if (transaction.buyerId !== session.user.id && transaction.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      ...transaction,
      agreedPriceGhs: transaction.agreedPriceGhs.toString(),
      milestones: transaction.milestones.map((m) => ({
        ...m,
        amountGhs: m.amountGhs.toString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json({ error: "Failed to fetch transaction" }, { status: 500 });
  }
}

type TransactionStatusType = "CREATED" | "ESCROW_REQUESTED" | "FUNDED" | "VERIFICATION_PERIOD" | "DISPUTED" | "READY_TO_RELEASE" | "RELEASED" | "REFUNDED" | "PARTIAL_SETTLED" | "CLOSED";

const updateTransactionSchema = z.object({
  status: z.enum(["CREATED", "ESCROW_REQUESTED", "FUNDED", "VERIFICATION_PERIOD", "DISPUTED", "READY_TO_RELEASE", "RELEASED", "REFUNDED", "PARTIAL_SETTLED", "CLOSED"]).optional(),
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

    const { id } = await params;
    const body = await request.json();
    const data = updateTransactionSchema.parse(body);

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        listing: { select: { id: true, title: true } },
        milestones: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Check authorization
    const isBuyer = transaction.buyerId === session.user.id;
    const isSeller = transaction.sellerId === session.user.id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle status update
    if (data.status) {
      const validTransitions = VALID_TRANSITIONS[transaction.status] || [];
      
      if (!validTransitions.includes(data.status)) {
        return NextResponse.json(
          { error: `Invalid status transition from ${transaction.status} to ${data.status}` },
          { status: 400 }
        );
      }

      // Validate permissions for specific transitions
      if (data.status === "DISPUTED" && !isBuyer) {
        return NextResponse.json({ error: "Only buyer can raise dispute" }, { status: 403 });
      }

      if (data.status === "RELEASED" && !isSeller) {
        return NextResponse.json({ error: "Only seller can request release" }, { status: 403 });
      }

      const updatedTransaction = await prisma.transaction.update({
        where: { id },
        data: {
          status: data.status,
          closedAt: ["CLOSED", "RELEASED", "REFUNDED"].includes(data.status) ? new Date() : undefined,
        },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              town: true,
              district: true,
              region: true,
              media: { take: 1 },
            },
          },
          buyer: { select: { id: true, fullName: true, phone: true } },
          seller: { select: { id: true, fullName: true, phone: true } },
          milestones: { orderBy: { sortOrder: "asc" } },
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          entityType: "TRANSACTION",
          entityId: id,
          actorType: "USER",
          actorUserId: session.user.id,
          action: "STATUS_CHANGE",
          diff: { from: transaction.status, to: data.status },
        },
      });

      // If disputed, create a dispute record and notify seller
      if (data.status === "DISPUTED") {
        await prisma.dispute.create({
          data: {
            transactionId: id,
            raisedById: session.user.id,
            status: "OPEN",
            summary: "Dispute raised by buyer",
          },
        });
        notifyTransactionDisputed(transaction.sellerId, transaction.listing.title).catch(console.error);
      }

      // If released, calculate fees and process payout
      if (data.status === "RELEASED") {
        // Calculate fees based on seller's subscription
        const fees = await calculateTransactionFees(
          transaction.sellerId,
          transaction.agreedPriceGhs
        );

        // Create service charge records
        await createTransactionServiceCharges(
          id,
          transaction.sellerId,
          transaction.agreedPriceGhs
        );

        // Mark charges as collected (in real implementation, this would happen after actual payment processing)
        await markChargesCollected(id);

        // Create payout record for seller (net amount after fees)
        await prisma.payment.create({
          data: {
            transactionId: id,
            provider: "FLUTTERWAVE", // Or configured provider
            type: "PAYOUT",
            status: "PENDING",
            amount: fees.sellerNetAmount,
            fees: fees.sellerFeeAmount,
            netAmount: fees.sellerNetAmount,
            payeeUserId: transaction.sellerId,
          },
        });

        // Update listing status to SOLD
        await prisma.listing.update({
          where: { id: transaction.listingId },
          data: { status: "SOLD" },
        });

        // Notify seller with net amount
        notifyTransactionReleased(
          transaction.sellerId,
          transaction.listing.title,
          Number(fees.sellerNetAmount)
        ).catch(console.error);

        // Log fee details in audit
        await prisma.auditLog.create({
          data: {
            entityType: "TRANSACTION",
            entityId: id,
            actorType: "SYSTEM",
            action: "FEES_COLLECTED",
            diff: {
              transactionAmount: transaction.agreedPriceGhs.toString(),
              sellerFeeRate: fees.sellerFeeRate,
              sellerFeeAmount: fees.sellerFeeAmount.toString(),
              sellerNetAmount: fees.sellerNetAmount.toString(),
              subscriptionPlan: fees.subscriptionPlan,
            },
          },
        });
      }

      return NextResponse.json({
        ...updatedTransaction,
        agreedPriceGhs: updatedTransaction.agreedPriceGhs.toString(),
        milestones: updatedTransaction.milestones.map((m) => ({
          ...m,
          amountGhs: m.amountGhs.toString(),
        })),
      });
    }

    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating transaction:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

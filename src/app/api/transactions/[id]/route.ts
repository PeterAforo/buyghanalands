import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyTransactionDisputed, notifyTransactionReleased } from "@/lib/notifications";

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

      // If released, notify seller
      if (data.status === "RELEASED") {
        notifyTransactionReleased(transaction.sellerId, transaction.listing.title, Number(transaction.agreedPriceGhs)).catch(console.error);
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

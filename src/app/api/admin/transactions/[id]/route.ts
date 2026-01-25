import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.some((role) => ["ADMIN", "SUPPORT", "MODERATOR"].includes(role)) || false;
}

const updateTransactionSchema = z.object({
  status: z.enum([
    "CREATED",
    "ESCROW_REQUESTED",
    "FUNDED",
    "VERIFICATION_PERIOD",
    "DISPUTED",
    "READY_TO_RELEASE",
    "RELEASED",
    "REFUNDED",
    "CLOSED",
  ]).optional(),
  notes: z.string().optional(),
});

// Get single transaction details
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

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            region: true,
            district: true,
            priceGhs: true,
            sizeAcres: true,
          },
        },
        buyer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            kycTier: true,
          },
        },
        seller: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            kycTier: true,
          },
        },
        payments: true,
        disputes: true,
        milestones: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...transaction,
      agreedPriceGhs: transaction.agreedPriceGhs.toString(),
      platformFeeGhs: transaction.platformFeeGhs.toString(),
      sellerNetGhs: transaction.sellerNetGhs.toString(),
      listing: transaction.listing
        ? {
            ...transaction.listing,
            priceGhs: transaction.listing.priceGhs.toString(),
            sizeAcres: transaction.listing.sizeAcres.toString(),
          }
        : null,
      payments: transaction.payments.map((p) => ({
        ...p,
        amount: p.amount.toString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json({ error: "Failed to fetch transaction" }, { status: 500 });
  }
}

// Update transaction status (moderation action)
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
    const { action } = body;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    type TransactionStatusType = "CREATED" | "ESCROW_REQUESTED" | "FUNDED" | "VERIFICATION_PERIOD" | "DISPUTED" | "READY_TO_RELEASE" | "RELEASED" | "REFUNDED" | "CLOSED";
    let newStatus: TransactionStatusType;

    switch (action) {
      case "release":
        newStatus = "RELEASED";
        break;
      case "refund":
        newStatus = "REFUNDED";
        break;
      case "close":
        newStatus = "CLOSED";
        break;
      case "dispute":
        newStatus = "DISPUTED";
        break;
      case "ready":
        newStatus = "READY_TO_RELEASE";
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        status: newStatus,
        completedAt: ["RELEASED", "REFUNDED", "CLOSED"].includes(newStatus) ? new Date() : undefined,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "TRANSACTION",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: `TRANSACTION_${action.toUpperCase()}`,
        diff: { from: transaction.status, to: newStatus },
      },
    });

    return NextResponse.json({
      ...updatedTransaction,
      agreedPriceGhs: updatedTransaction.agreedPriceGhs.toString(),
      platformFeeGhs: updatedTransaction.platformFeeGhs.toString(),
      sellerNetGhs: updatedTransaction.sellerNetGhs.toString(),
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

// Update transaction details (PATCH)
export async function PATCH(
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
    const validatedData = updateTransactionSchema.parse(body);

    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (validatedData.status) {
      updateData.status = validatedData.status;
      if (["RELEASED", "REFUNDED", "CLOSED"].includes(validatedData.status)) {
        updateData.completedAt = new Date();
      }
    }
    if (validatedData.notes) updateData.notes = validatedData.notes;

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "TRANSACTION",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "TRANSACTION_UPDATED_BY_ADMIN",
        diff: { before: existingTransaction.status, changes: validatedData },
      },
    });

    return NextResponse.json({
      ...updatedTransaction,
      agreedPriceGhs: updatedTransaction.agreedPriceGhs.toString(),
      platformFeeGhs: updatedTransaction.platformFeeGhs.toString(),
      sellerNetGhs: updatedTransaction.sellerNetGhs.toString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error updating transaction:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

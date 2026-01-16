import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createTransactionSchema = z.object({
  offerId: z.string().min(1),
});

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

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createTransactionSchema.parse(body);

    // Get the offer
    const offer = await prisma.offer.findUnique({
      where: { id: data.offerId },
      include: {
        listing: {
          select: { id: true, sellerId: true, status: true },
        },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    if (offer.status !== "ACCEPTED") {
      return NextResponse.json(
        { error: "Offer must be accepted first" },
        { status: 400 }
      );
    }

    // Check if transaction already exists for this offer
    const existingTransaction = await prisma.transaction.findUnique({
      where: { offerId: data.offerId },
    });

    if (existingTransaction) {
      return NextResponse.json(
        { error: "Transaction already exists for this offer" },
        { status: 400 }
      );
    }

    // Only buyer or seller can create transaction
    if (
      offer.buyerId !== session.user.id &&
      offer.listing.sellerId !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        listingId: offer.listingId,
        offerId: offer.id,
        buyerId: offer.buyerId,
        sellerId: offer.listing.sellerId,
        agreedPriceGhs: offer.amountGhs,
        status: "CREATED",
      },
      include: {
        listing: { select: { title: true } },
        buyer: { select: { fullName: true } },
        seller: { select: { fullName: true } },
      },
    });

    // Create default milestones
    await prisma.escrowMilestone.createMany({
      data: [
        {
          transactionId: transaction.id,
          name: "Initial Deposit",
          description: "Buyer deposits funds into escrow",
          amountGhs: offer.amountGhs,
          sortOrder: 1,
        },
        {
          transactionId: transaction.id,
          name: "Document Verification",
          description: "Verify all land documents",
          amountGhs: 0,
          sortOrder: 2,
        },
        {
          transactionId: transaction.id,
          name: "Final Transfer",
          description: "Complete ownership transfer",
          amountGhs: 0,
          sortOrder: 3,
        },
      ],
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "TRANSACTION",
        entityId: transaction.id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "CREATE",
        diff: { offerId: data.offerId, agreedPriceGhs: Number(offer.amountGhs) },
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role"); // "buyer" or "seller"

    const where =
      role === "seller"
        ? { sellerId: session.user.id }
        : role === "buyer"
        ? { buyerId: session.user.id }
        : {
            OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }],
          };

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            town: true,
            district: true,
            media: { take: 1 },
          },
        },
        buyer: { select: { id: true, fullName: true } },
        seller: { select: { id: true, fullName: true } },
        milestones: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

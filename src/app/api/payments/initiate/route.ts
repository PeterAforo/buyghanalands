import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";
import { initiateCheckout, generateTransactionId } from "@/lib/theteller";
import { z } from "zod";

const initiatePaymentSchema = z.object({
  listingId: z.string(),
  amount: z.number().positive(),
  type: z.enum(["ESCROW_DEPOSIT", "FULL_PAYMENT", "LISTING_FEE"]),
  transactionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = initiatePaymentSchema.parse(body);

    // Get user details
    const user = await withDbRetry(() => prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, phone: true, fullName: true },
    }));

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get listing details
    const listing = await withDbRetry(() => prisma.listing.findUnique({
      where: { id: data.listingId },
      select: {
        id: true,
        title: true,
        priceGhs: true,
        sellerId: true,
        status: true,
      },
    }));

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Listing is not available" }, { status: 400 });
    }

    if (listing.sellerId === session.user.id) {
      return NextResponse.json({ error: "Cannot purchase your own listing" }, { status: 400 });
    }

    // Generate unique 12-digit transaction id
    const txRef = generateTransactionId();

    // Create payment record
    const payment = await withDbRetry(() => prisma.payment.create({
      data: {
        listingId: data.listingId,
        transactionId: data.transactionId,
        provider: "THETELLER",
        type: data.type === "LISTING_FEE" ? "LISTING_FEE" : "TRANSACTION_FUNDING",
        status: "INITIATED",
        currency: "GHS",
        amount: BigInt(Math.round(data.amount * 100)), // Store in pesewas
        payerUserId: session.user.id,
        payeeUserId: listing.sellerId,
        providerRef: txRef,
      },
    }));

    // Initialize Theteller checkout
    const checkoutResponse = await initiateCheckout({
      desc: `Land purchase: ${listing.title}`,
      amountGhs: data.amount,
      email: user.email || `${user.phone}@buyghanalands.com`,
      transactionId: txRef,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payments/callback`,
    });

    if (checkoutResponse.status !== "success" || !checkoutResponse.checkout_url) {
      // Update payment status to failed
      await withDbRetry(() => prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      }));

      return NextResponse.json(
        { error: checkoutResponse.reason || "Payment initialization failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      txRef,
      paymentUrl: checkoutResponse.checkout_url,
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

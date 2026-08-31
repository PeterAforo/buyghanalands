import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";
import { initiateCheckout, generateTransactionId } from "@/lib/theteller";

const initializePaymentSchema = z.object({
  transactionId: z.string().optional(),
  listingId: z.string().optional(),
  type: z.enum(["LISTING_FEE", "TRANSACTION_FUNDING"]),
  amount: z.number().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = initializePaymentSchema.parse(body);

    // Get user details
    const user = await withDbRetry(() => prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, phone: true, fullName: true },
    }));

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Use email if available, otherwise generate a placeholder from phone
    const payerEmail = user.email || `${user.phone.replace(/\D/g, '')}@buyghanalands.com`;

    const reference = generateTransactionId();

    // Create payment record
    const payment = await withDbRetry(() => prisma.payment.create({
      data: {
        transactionId: data.transactionId,
        listingId: data.listingId,
        provider: "THETELLER",
        type: data.type,
        status: "INITIATED",
        amount: data.amount,
        payerUserId: session.user.id,
        providerRef: reference,
      },
    }));

    // Initialize Theteller checkout
    const checkoutResponse = await initiateCheckout({
      desc: "Land purchase payment",
      amountGhs: data.amount,
      email: payerEmail,
      transactionId: reference,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payments/callback`,
    });

    if (checkoutResponse.status !== "success" || !checkoutResponse.checkout_url) {
      await withDbRetry(() => prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      }));

      return NextResponse.json(
        { error: "Failed to initialize payment" },
        { status: 500 }
      );
    }

    await withDbRetry(() => prisma.payment.update({
      where: { id: payment.id },
      data: { status: "PENDING" },
    }));

    return NextResponse.json({
      paymentId: payment.id,
      paymentUrl: checkoutResponse.checkout_url,
      reference,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error initializing payment:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}

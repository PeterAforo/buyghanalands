import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  initializePayment,
  generateReference,
  convertToPesewas,
} from "@/lib/paystack";

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

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, phone: true },
    });

    if (!user?.email) {
      return NextResponse.json(
        { error: "Email required for payment" },
        { status: 400 }
      );
    }

    const reference = generateReference();

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        transactionId: data.transactionId,
        listingId: data.listingId,
        provider: "PAYSTACK",
        type: data.type,
        status: "INITIATED",
        amount: data.amount,
        payerUserId: session.user.id,
        providerRef: reference,
      },
    });

    // Initialize Paystack payment
    const callbackUrl = `${process.env.NEXTAUTH_URL}/api/payments/callback`;

    const paystackResponse = await initializePayment({
      email: user.email,
      amount: convertToPesewas(data.amount),
      reference,
      callbackUrl,
      metadata: {
        paymentId: payment.id,
        userId: session.user.id,
        type: data.type,
      },
    });

    if (!paystackResponse.status) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });

      return NextResponse.json(
        { error: "Failed to initialize payment" },
        { status: 500 }
      );
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "PENDING" },
    });

    return NextResponse.json({
      paymentId: payment.id,
      authorizationUrl: paystackResponse.data.authorization_url,
      reference: paystackResponse.data.reference,
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

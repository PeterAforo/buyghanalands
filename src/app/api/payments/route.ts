import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { initializePayment } from "@/lib/flutterwave";

function generateReference(): string {
  return `BGL-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

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
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, phone: true, fullName: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Use email if available, otherwise generate a placeholder from phone
    const payerEmail = user.email || `${user.phone.replace(/\D/g, '')}@buyghanalands.com`;

    const reference = generateReference();

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        transactionId: data.transactionId,
        listingId: data.listingId,
        provider: "FLUTTERWAVE",
        type: data.type,
        status: "INITIATED",
        amount: data.amount,
        payerUserId: session.user.id,
        providerRef: reference,
      },
    });

    // Initialize Flutterwave payment
    const flutterwaveResponse = await initializePayment({
      amount: data.amount,
      email: payerEmail,
      phone: user.phone,
      name: user.fullName,
      txRef: reference,
      currency: "GHS",
      meta: {
        paymentId: payment.id,
        userId: session.user.id,
        type: data.type,
      },
    });

    if (flutterwaveResponse.status !== "success" || !flutterwaveResponse.data?.link) {
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
      paymentUrl: flutterwaveResponse.data.link,
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

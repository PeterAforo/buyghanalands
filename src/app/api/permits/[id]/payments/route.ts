import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    const permit = await prisma.permitApplication.findUnique({
      where: { id },
      select: { applicantId: true },
    });

    if (!permit) {
      return NextResponse.json({ error: "Permit not found" }, { status: 404 });
    }

    if (permit.applicantId !== session.user.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { roles: true },
      });
      if (!user?.roles.some((r) => ["ADMIN", "FINANCE"].includes(r))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const payments = await prisma.permitFeePayment.findMany({
      where: { permitApplicationId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      payments.map((p) => ({
        ...p,
        amount: p.amount.toString(),
      }))
    );
  } catch (error) {
    console.error("Error fetching permit payments:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

const initiatePaymentSchema = z.object({
  feeType: z.enum(["APPLICATION_FEE", "PROCESSING_FEE", "INSPECTION_FEE", "OTHER"]),
  amount: z.number().min(1),
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
    const data = initiatePaymentSchema.parse(body);

    const permit = await prisma.permitApplication.findUnique({
      where: { id },
      select: { applicantId: true },
    });

    if (!permit) {
      return NextResponse.json({ error: "Permit not found" }, { status: 404 });
    }

    if (permit.applicantId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check for existing pending payment of same type
    const existingPayment = await prisma.permitFeePayment.findFirst({
      where: {
        permitApplicationId: id,
        feeType: data.feeType,
        status: { in: ["INITIATED", "PENDING"] },
      },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: "A payment for this fee type is already pending" },
        { status: 400 }
      );
    }

    const payment = await prisma.permitFeePayment.create({
      data: {
        permitApplicationId: id,
        feeType: data.feeType,
        amount: BigInt(data.amount),
        status: "INITIATED",
      },
    });

    // In production, this would initiate payment with PSP
    // For now, return payment reference

    return NextResponse.json({
      message: "Payment initiated",
      payment: {
        ...payment,
        amount: payment.amount.toString(),
      },
      // In production: paymentUrl, reference, etc.
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error initiating permit payment:", error);
    return NextResponse.json({ error: "Failed to initiate payment" }, { status: 500 });
  }
}

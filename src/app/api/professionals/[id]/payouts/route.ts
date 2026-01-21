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

    // Verify ownership or admin
    const professional = await prisma.professionalProfile.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!professional) {
      return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });

    const isAdmin = user?.roles.some((r) => ["ADMIN", "FINANCE"].includes(r));
    if (professional.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get completed bookings with payment info
    const bookings = await prisma.booking.findMany({
      where: {
        professionalId: id,
        status: "COMPLETED",
      },
      include: {
        serviceRequest: {
          select: {
            id: true,
            title: true,
            acceptedPriceGhs: true,
            requester: { select: { fullName: true } },
          },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    // Calculate totals
    const totalEarnings = bookings.reduce((sum, b) => {
      return sum + Number(b.serviceRequest.acceptedPriceGhs || 0);
    }, 0);

    // Get pending payouts (simplified - in production would have separate payout table)
    const pendingPayouts = bookings.filter((b) => !b.completedAt);

    return NextResponse.json({
      professionalId: id,
      totalEarnings,
      completedBookings: bookings.length,
      pendingPayouts: pendingPayouts.length,
      bookings: bookings.map((b) => ({
        id: b.id,
        title: b.serviceRequest.title,
        client: b.serviceRequest.requester.fullName,
        amount: b.serviceRequest.acceptedPriceGhs?.toString() || "0",
        completedAt: b.completedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching payouts:", error);
    return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 });
  }
}

const requestPayoutSchema = z.object({
  amount: z.number().min(1),
  bankCode: z.string().optional(),
  accountNumber: z.string().optional(),
  mobileMoneyNumber: z.string().optional(),
  provider: z.enum(["BANK", "MOMO"]).default("MOMO"),
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
    const data = requestPayoutSchema.parse(body);

    // Verify ownership
    const professional = await prisma.professionalProfile.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!professional) {
      return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    }

    if (professional.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create payout request (simplified - would integrate with payment provider)
    const payment = await prisma.payment.create({
      data: {
        type: "PROFESSIONAL_PAYOUT",
        payeeUserId: session.user.id,
        amount: BigInt(data.amount),
        fees: BigInt(0),
        netAmount: BigInt(data.amount),
        currency: "GHS",
        provider: data.provider === "MOMO" ? "HUBTEL" : "BANK_TRANSFER",
        status: "PENDING",
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "PAYMENT",
        entityId: payment.id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "PAYOUT_REQUEST",
        diff: { amount: data.amount, provider: data.provider },
      },
    });

    return NextResponse.json({
      message: "Payout request submitted",
      paymentId: payment.id,
      status: payment.status,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error requesting payout:", error);
    return NextResponse.json({ error: "Failed to request payout" }, { status: 500 });
  }
}

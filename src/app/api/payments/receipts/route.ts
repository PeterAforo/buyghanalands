import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");
    const transactionId = searchParams.get("transactionId");

    if (!paymentId && !transactionId) {
      return NextResponse.json({ error: "paymentId or transactionId required" }, { status: 400 });
    }

    let payment;

    if (paymentId) {
      payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          transaction: {
            include: {
              listing: { select: { id: true, title: true, region: true, district: true } },
              buyer: { select: { id: true, fullName: true, email: true, phone: true } },
              seller: { select: { id: true, fullName: true, email: true, phone: true } },
            },
          },
          listing: { select: { id: true, title: true } },
          payerUser: { select: { id: true, fullName: true } },
          payeeUser: { select: { id: true, fullName: true } },
        },
      });
    } else {
      // Get all payments for a transaction
      const payments = await prisma.payment.findMany({
        where: { transactionId: transactionId! },
        include: {
          transaction: {
            include: {
              listing: { select: { id: true, title: true, region: true, district: true } },
              buyer: { select: { id: true, fullName: true, email: true, phone: true } },
              seller: { select: { id: true, fullName: true, email: true, phone: true } },
            },
          },
          payerUser: { select: { id: true, fullName: true } },
          payeeUser: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      if (payments.length === 0) {
        return NextResponse.json({ error: "No payments found" }, { status: 404 });
      }

      // Check authorization
      const tx = payments[0].transaction;
      if (tx && tx.buyerId !== session.user.id && tx.sellerId !== session.user.id) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { roles: true },
        });
        if (!user?.roles.some((r) => ["ADMIN", "FINANCE"].includes(r))) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }

      return NextResponse.json({
        receipts: payments.map((p) => generateReceipt(p)),
      });
    }

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Check authorization
    const isParty = payment.payerUserId === session.user.id || 
                    payment.payeeUserId === session.user.id ||
                    payment.transaction?.buyerId === session.user.id ||
                    payment.transaction?.sellerId === session.user.id;

    if (!isParty) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { roles: true },
      });
      if (!user?.roles.some((r) => ["ADMIN", "FINANCE"].includes(r))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ receipt: generateReceipt(payment) });
  } catch (error) {
    console.error("Error generating receipt:", error);
    return NextResponse.json({ error: "Failed to generate receipt" }, { status: 500 });
  }
}

function generateReceipt(payment: any) {
  const receiptNumber = payment.receiptRef || `BGL-${payment.id.slice(0, 8).toUpperCase()}`;
  
  return {
    receiptNumber,
    paymentId: payment.id,
    date: payment.createdAt,
    status: payment.status,
    type: payment.type,
    provider: payment.provider,
    providerReference: payment.providerRef,
    
    amount: {
      gross: payment.amount.toString(),
      fees: payment.fees.toString(),
      net: payment.netAmount.toString(),
      currency: payment.currency,
    },
    
    payer: payment.payerUser ? {
      id: payment.payerUser.id,
      name: payment.payerUser.fullName,
    } : null,
    
    payee: payment.payeeUser ? {
      id: payment.payeeUser.id,
      name: payment.payeeUser.fullName,
    } : null,
    
    transaction: payment.transaction ? {
      id: payment.transaction.id,
      listing: payment.transaction.listing,
      buyer: payment.transaction.buyer,
      seller: payment.transaction.seller,
      agreedPrice: payment.transaction.agreedPriceGhs.toString(),
    } : null,
    
    listing: payment.listing ? {
      id: payment.listing.id,
      title: payment.listing.title,
    } : null,
    
    metadata: {
      generatedAt: new Date().toISOString(),
      platform: "BuyGhanaLands",
      platformAddress: "Accra, Ghana",
      supportEmail: "support@buyghanalands.com",
    },
  };
}

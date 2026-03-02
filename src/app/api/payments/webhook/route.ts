import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyTransactionFunded } from "@/lib/notifications";

const FLUTTERWAVE_SECRET_HASH = process.env.FLUTTERWAVE_SECRET_HASH;

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (Flutterwave sends this in verif-hash header)
    const signature = request.headers.get("verif-hash");
    
    if (!FLUTTERWAVE_SECRET_HASH) {
      // Log but don't expose that webhook is not configured
      return NextResponse.json({ status: "received" });
    }
    
    if (!signature || signature !== FLUTTERWAVE_SECRET_HASH) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = await request.json();
    const { event, data } = payload;

    if (event === "charge.completed" && data.status === "successful") {
      const txRef = data.tx_ref;

      // Find and update payment
      const payment = await prisma.payment.findFirst({
        where: { providerRef: txRef },
      });

      if (payment && payment.status !== "SUCCESS") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "SUCCESS",
            netAmount: payment.amount - payment.fees,
          },
        });

        // Update transaction if applicable
        if (payment.type === "TRANSACTION_FUNDING" && payment.transactionId) {
          const transaction = await prisma.transaction.update({
            where: { id: payment.transactionId },
            data: { status: "FUNDED" },
            include: {
              listing: { select: { title: true } },
            },
          });

          // Create audit log
          await prisma.auditLog.create({
            data: {
              entityType: "TRANSACTION",
              entityId: payment.transactionId,
              actorType: "SYSTEM",
              action: "STATUS_CHANGE",
              diff: { from: "ESCROW_REQUESTED", to: "FUNDED", via: "webhook" },
            },
          });

          // Notify seller
          notifyTransactionFunded(
            transaction.sellerId,
            transaction.listing.title,
            Number(payment.amount) / 100 // Convert from pesewas
          ).catch(() => {});
        }
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

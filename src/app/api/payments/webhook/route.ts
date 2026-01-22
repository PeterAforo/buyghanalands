import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

const FLUTTERWAVE_SECRET_HASH = process.env.FLUTTERWAVE_SECRET_HASH;

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get("verif-hash");
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
          await prisma.transaction.update({
            where: { id: payment.transactionId },
            data: { status: "FUNDED" },
          });
        }
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

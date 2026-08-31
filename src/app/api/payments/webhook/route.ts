import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/db";
import { notifyTransactionFunded } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    // Theteller does not provide a standard webhook signature header,
    // so we log the payload and process it directly. Ensure this endpoint
    // is only reachable via a trusted/internal network or behind a gateway.
    const payload = await request.json();
    console.log("Theteller webhook payload received:", payload);

    const { code, status, transaction_id } = payload;

    // Theteller reports success with code "000"
    if (code === "000" || status === "success") {
      // Find and update payment by the stored providerRef (transaction_id)
      const payment = await withDbRetry(() => prisma.payment.findFirst({
        where: { providerRef: transaction_id },
      }));

      if (payment && payment.status !== "SUCCESS") {
        await withDbRetry(() => prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "SUCCESS",
            netAmount: payment.amount - payment.fees,
          },
        }));

        // Update transaction if applicable
        if (payment.type === "TRANSACTION_FUNDING" && payment.transactionId) {
          const transactionId = payment.transactionId;
          const transaction = await withDbRetry(() => prisma.transaction.update({
            where: { id: transactionId },
            data: { status: "FUNDED" },
            include: {
              listing: { select: { title: true } },
            },
          }));

          // Create audit log
          await withDbRetry(() => prisma.auditLog.create({
            data: {
              entityType: "TRANSACTION",
              entityId: transactionId,
              actorType: "SYSTEM",
              action: "STATUS_CHANGE",
              diff: { from: "ESCROW_REQUESTED", to: "FUNDED", via: "webhook" },
            },
          }));

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
    console.error("Theteller webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

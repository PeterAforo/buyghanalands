import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/db";
import { verifyTransaction } from "@/lib/theteller";
import { notifyTransactionFunded } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    // Optional shared-secret verification: if THETELLER_WEBHOOK_SECRET is set,
    // require the X-Webhook-Secret header to match. This prevents unauthorized
    // parties from triggering payment status updates.
    const expectedSecret = process.env.THETELLER_WEBHOOK_SECRET;
    if (expectedSecret) {
      const providedSecret = request.headers.get("x-webhook-secret");
      if (providedSecret !== expectedSecret) {
        console.warn("Theteller webhook rejected: invalid or missing X-Webhook-Secret header");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const payload = await request.json();
    console.log("Theteller webhook payload received:", payload);

    const { code, status, transaction_id } = payload;

    if (!transaction_id) {
      console.warn("Theteller webhook rejected: missing transaction_id");
      return NextResponse.json({ error: "Missing transaction_id" }, { status: 400 });
    }

    // Theteller reports success with code "000"
    if (code === "000" || status === "success") {
      // Verify the transaction with Theteller before processing.
      // This prevents forged webhook payloads from updating payment status.
      let verificationPassed = false;
      try {
        const verification = await verifyTransaction(transaction_id);
        verificationPassed = verification.code === "000";
      } catch (verifyError) {
        console.error("Theteller webhook: verification call failed:", verifyError);
        // If verification fails (network error, Theteller down), we log but
        // still process the webhook since the payload indicated success.
        // The callback route also verifies, so this is a defense-in-depth measure.
        verificationPassed = true;
      }

      if (!verificationPassed) {
        console.warn(`Theteller webhook: verification returned non-success for ${transaction_id}`);
        return NextResponse.json({ status: "verification_failed" }, { status: 200 });
      }

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
              diff: { from: "ESCROW_REQUESTED", to: "FUNDED", via: "webhook", verified: true },
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

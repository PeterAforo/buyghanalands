import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/db";
import { verifyTransaction } from "@/lib/theteller";
import { notifyTransactionFunded } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transaction_id");
    const code = searchParams.get("code");
    const status = searchParams.get("status");

    if (!transactionId) {
      return NextResponse.redirect(
        new URL("/dashboard?payment=error", request.url)
      );
    }

    // If Theteller says the transaction was not successful, mark as failed
    if (code !== "000") {
      await withDbRetry(() => prisma.payment.updateMany({
        where: { providerRef: transactionId },
        data: { status: "FAILED" },
      }));
      return NextResponse.redirect(
        new URL(`/dashboard?payment=${status === "cancelled" ? "cancelled" : "failed"}`, request.url)
      );
    }

    // Verify payment with Theteller
    const verification = await verifyTransaction(transactionId);

    if (verification.code !== "000") {
      // Update payment status to failed
      await withDbRetry(() => prisma.payment.updateMany({
        where: { providerRef: transactionId },
        data: { status: "FAILED" },
      }));

      return NextResponse.redirect(
        new URL("/dashboard?payment=failed", request.url)
      );
    }

    // Update payment status to success
    const payment = await withDbRetry(() => prisma.payment.findFirst({
      where: { providerRef: transactionId },
    }));

    if (!payment) {
      return NextResponse.redirect(
        new URL("/dashboard?payment=error", request.url)
      );
    }

    await withDbRetry(() => prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        netAmount: payment.amount - payment.fees,
      },
    }));

    // Handle post-payment logic based on payment type
    if (payment.type === "TRANSACTION_FUNDING" && payment.transactionId) {
      const fundedTransactionId = payment.transactionId;
      // Update transaction status to FUNDED
      const transaction = await withDbRetry(() => prisma.transaction.update({
        where: { id: fundedTransactionId },
        data: { status: "FUNDED" },
        include: {
          listing: { select: { title: true } },
        },
      }));

      // Create audit log
      await withDbRetry(() => prisma.auditLog.create({
        data: {
          entityType: "TRANSACTION",
          entityId: fundedTransactionId,
          actorType: "SYSTEM",
          action: "STATUS_CHANGE",
          diff: { from: "ESCROW_REQUESTED", to: "FUNDED" },
        },
      }));

      // Notify seller that escrow is funded
      notifyTransactionFunded(transaction.sellerId, transaction.listing.title, Number(payment.amount)).catch(console.error);

      return NextResponse.redirect(
        new URL(
          `/dashboard/transactions/${fundedTransactionId}?payment=success`,
          request.url
        )
      );
    }

    if (payment.type === "LISTING_FEE" && payment.listingId) {
      // Update listing status if needed
      return NextResponse.redirect(
        new URL(
          `/dashboard/listings/${payment.listingId}?payment=success`,
          request.url
        )
      );
    }

    return NextResponse.redirect(
      new URL("/dashboard?payment=success", request.url)
    );
  } catch (error) {
    console.error("Payment callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard?payment=error", request.url)
    );
  }
}

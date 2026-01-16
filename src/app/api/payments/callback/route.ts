import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPaymentByTxRef } from "@/lib/flutterwave";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const txRef = searchParams.get("tx_ref");
    const status = searchParams.get("status");
    const transactionId = searchParams.get("transaction_id");

    if (!txRef) {
      return NextResponse.redirect(
        new URL("/dashboard?payment=error", request.url)
      );
    }

    // If Flutterwave says cancelled, mark as failed
    if (status === "cancelled") {
      await prisma.payment.updateMany({
        where: { providerRef: txRef },
        data: { status: "FAILED" },
      });
      return NextResponse.redirect(
        new URL("/dashboard?payment=cancelled", request.url)
      );
    }

    // Verify payment with Flutterwave
    const verification = await verifyPaymentByTxRef(txRef);

    if (verification.status !== "success" || verification.data?.status !== "successful") {
      // Update payment status to failed
      await prisma.payment.updateMany({
        where: { providerRef: txRef },
        data: { status: "FAILED" },
      });

      return NextResponse.redirect(
        new URL("/dashboard?payment=failed", request.url)
      );
    }

    // Update payment status to success
    const payment = await prisma.payment.findFirst({
      where: { providerRef: txRef },
    });

    if (!payment) {
      return NextResponse.redirect(
        new URL("/dashboard?payment=error", request.url)
      );
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        netAmount: payment.amount - payment.fees,
      },
    });

    // Handle post-payment logic based on payment type
    if (payment.type === "TRANSACTION_FUNDING" && payment.transactionId) {
      // Update transaction status to FUNDED
      await prisma.transaction.update({
        where: { id: payment.transactionId },
        data: { status: "FUNDED" },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          entityType: "TRANSACTION",
          entityId: payment.transactionId,
          actorType: "SYSTEM",
          action: "STATUS_CHANGE",
          diff: { from: "ESCROW_REQUESTED", to: "FUNDED" },
        },
      });

      return NextResponse.redirect(
        new URL(
          `/dashboard/transactions/${payment.transactionId}?payment=success`,
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

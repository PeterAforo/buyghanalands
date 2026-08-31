import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";
import { notifyTransactionDisputed, notifyTransactionReleased, notifyPayoutProcessed, notifyPayoutFailed } from "@/lib/notifications";
import { calculateTransactionFees, createTransactionServiceCharges, markChargesCollected } from "@/lib/fees";
import { transferToMobileMoney, transferToBank, generateTransactionId } from "@/lib/theteller";

const VALID_TRANSITIONS: Record<string, string[]> = {
  CREATED: ["ESCROW_REQUESTED"],
  ESCROW_REQUESTED: ["FUNDED"],
  FUNDED: ["VERIFICATION_PERIOD"],
  VERIFICATION_PERIOD: ["READY_TO_RELEASE", "DISPUTED"],
  DISPUTED: ["READY_TO_RELEASE", "REFUNDED", "PARTIAL_SETTLED"],
  READY_TO_RELEASE: ["RELEASED"],
  RELEASED: ["CLOSED"],
  REFUNDED: ["CLOSED"],
  PARTIAL_SETTLED: ["CLOSED"],
};

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

    const transaction = await withDbRetry(() => prisma.transaction.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            town: true,
            district: true,
            region: true,
            media: { take: 1 },
          },
        },
        buyer: { select: { id: true, fullName: true, phone: true } },
        seller: { select: { id: true, fullName: true, phone: true } },
        milestones: { orderBy: { sortOrder: "asc" } },
        payments: { orderBy: { createdAt: "desc" } },
      },
    }));

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Check authorization
    if (transaction.buyerId !== session.user.id && transaction.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      ...transaction,
      agreedPriceGhs: transaction.agreedPriceGhs.toString(),
      milestones: transaction.milestones.map((m) => ({
        ...m,
        amountGhs: m.amountGhs.toString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json({ error: "Failed to fetch transaction" }, { status: 500 });
  }
}

type TransactionStatusType = "CREATED" | "ESCROW_REQUESTED" | "FUNDED" | "VERIFICATION_PERIOD" | "DISPUTED" | "READY_TO_RELEASE" | "RELEASED" | "REFUNDED" | "PARTIAL_SETTLED" | "CLOSED";

const updateTransactionSchema = z.object({
  status: z.enum(["CREATED", "ESCROW_REQUESTED", "FUNDED", "VERIFICATION_PERIOD", "DISPUTED", "READY_TO_RELEASE", "RELEASED", "REFUNDED", "PARTIAL_SETTLED", "CLOSED"]).optional(),
});

export async function PUT(
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
    const data = updateTransactionSchema.parse(body);

    const transaction = await withDbRetry(() => prisma.transaction.findUnique({
      where: { id },
      include: {
        listing: { select: { id: true, title: true } },
        milestones: true,
      },
    }));

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Check authorization
    const isBuyer = transaction.buyerId === session.user.id;
    const isSeller = transaction.sellerId === session.user.id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle status update
    if (data.status) {
      const validTransitions = VALID_TRANSITIONS[transaction.status] || [];
      
      if (!validTransitions.includes(data.status)) {
        return NextResponse.json(
          { error: `Invalid status transition from ${transaction.status} to ${data.status}` },
          { status: 400 }
        );
      }

      // Validate permissions for specific transitions
      if (data.status === "DISPUTED" && !isBuyer) {
        return NextResponse.json({ error: "Only buyer can raise dispute" }, { status: 403 });
      }

      if (data.status === "RELEASED" && !isSeller) {
        return NextResponse.json({ error: "Only seller can request release" }, { status: 403 });
      }

      const updatedTransaction = await withDbRetry(() => prisma.transaction.update({
        where: { id },
        data: {
          status: data.status,
          closedAt: data.status && ["CLOSED", "RELEASED", "REFUNDED"].includes(data.status) ? new Date() : undefined,
        },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              town: true,
              district: true,
              region: true,
              media: { take: 1 },
            },
          },
          buyer: { select: { id: true, fullName: true, phone: true } },
          seller: { select: { id: true, fullName: true, phone: true } },
          milestones: { orderBy: { sortOrder: "asc" } },
        },
      }));

      // Create audit log
      await withDbRetry(() => prisma.auditLog.create({
        data: {
          entityType: "TRANSACTION",
          entityId: id,
          actorType: "USER",
          actorUserId: session.user.id,
          action: "STATUS_CHANGE",
          diff: { from: transaction.status, to: data.status },
        },
      }));

      // If disputed, create a dispute record and notify seller
      if (data.status === "DISPUTED") {
        await withDbRetry(() => prisma.dispute.create({
          data: {
            transactionId: id,
            raisedById: session.user.id,
            status: "OPEN",
            summary: "Dispute raised by buyer",
          },
        }));
        notifyTransactionDisputed(transaction.sellerId, transaction.listing.title).catch(console.error);
      }

      // If released, calculate fees and process payout
      if (data.status === "RELEASED") {
        // Calculate fees based on seller's subscription
        const fees = await calculateTransactionFees(
          transaction.sellerId,
          transaction.agreedPriceGhs
        );

        // Create service charge records
        await createTransactionServiceCharges(
          id,
          transaction.sellerId,
          transaction.agreedPriceGhs
        );

        // Mark charges as collected (in real implementation, this would happen after actual payment processing)
        await markChargesCollected(id);

        // Create payout record for seller (net amount after fees)
        // Make payout idempotent: skip if a PAYOUT payment already exists for this transaction
        const existingPayout = await withDbRetry(() => prisma.payment.findFirst({
          where: { transactionId: id, type: "PAYOUT" },
        }));

        if (!existingPayout) {
          // Fetch seller's payout account details
          const seller = await withDbRetry(() => prisma.user.findUnique({
            where: { id: transaction.sellerId },
            select: {
              id: true,
              payoutAccountType: true,
              payoutAccountNumber: true,
              payoutAccountIssuer: true,
              payoutAccountBank: true,
            },
          }));

          const sellerNetGhs = Number(fees.sellerNetAmount) / 100;
          const payoutTransactionId = generateTransactionId();

          if (!seller || !seller.payoutAccountType || !seller.payoutAccountNumber) {
            // Seller has no payout account configured — create a PENDING payout and notify admin
            const payout = await withDbRetry(() => prisma.payment.create({
              data: {
                transactionId: id,
                provider: "THETELLER",
                type: "PAYOUT",
                status: "PENDING",
                amount: fees.sellerNetAmount,
                fees: fees.sellerFeeAmount,
                netAmount: fees.sellerNetAmount,
                payeeUserId: transaction.sellerId,
                providerRef: payoutTransactionId,
              },
            }));

            await withDbRetry(() => prisma.auditLog.create({
              data: {
                entityType: "PAYMENT",
                entityId: payout.id,
                actorType: "SYSTEM",
                action: "PAYOUT_PENDING",
                diff: {
                  reason: "Seller payout account not configured",
                  transactionId: id,
                  sellerId: transaction.sellerId,
                },
              },
            }));
          } else {
            // Create the payout record first as PENDING, then attempt the transfer
            const payout = await withDbRetry(() => prisma.payment.create({
              data: {
                transactionId: id,
                provider: "THETELLER",
                type: "PAYOUT",
                status: "PENDING",
                amount: fees.sellerNetAmount,
                fees: fees.sellerFeeAmount,
                netAmount: fees.sellerNetAmount,
                payeeUserId: transaction.sellerId,
                providerRef: payoutTransactionId,
              },
            }));

            try {
              let transferResult;
              if (seller.payoutAccountType === "MOBILE_MONEY") {
                transferResult = await transferToMobileMoney({
                  account_number: seller.payoutAccountNumber,
                  account_issuer: seller.payoutAccountIssuer || "MTN",
                  amountGhs: sellerNetGhs,
                  desc: `Payout for land sale: ${transaction.listing.title}`,
                  transactionId: payoutTransactionId,
                });
              } else if (seller.payoutAccountType === "BANK") {
                transferResult = await transferToBank({
                  account_number: seller.payoutAccountNumber,
                  account_bank: seller.payoutAccountBank || "",
                  account_issuer: "GIP",
                  amountGhs: sellerNetGhs,
                  desc: `Payout for land sale: ${transaction.listing.title}`,
                  transactionId: payoutTransactionId,
                });
              } else {
                throw new Error(`Unsupported payout account type: ${seller.payoutAccountType}`);
              }

              if (transferResult && transferResult.code === "000") {
                // Transfer succeeded — update payout to SUCCESS
                await withDbRetry(() => prisma.payment.update({
                  where: { id: payout.id },
                  data: {
                    status: "SUCCESS",
                    providerRef: transferResult.transaction_id || payoutTransactionId,
                  },
                }));

                notifyPayoutProcessed(
                  transaction.sellerId,
                  transaction.listing.title,
                  sellerNetGhs,
                  transferResult.transaction_id || payoutTransactionId
                ).catch(console.error);
              } else {
                // Transfer returned a non-success code
                const failReason = transferResult?.reason || "Transfer not approved";
                await withDbRetry(() => prisma.payment.update({
                  where: { id: payout.id },
                  data: { status: "FAILED" },
                }));

                console.error("Theteller payout failed:", failReason);

                await withDbRetry(() => prisma.auditLog.create({
                  data: {
                    entityType: "PAYMENT",
                    entityId: payout.id,
                    actorType: "SYSTEM",
                    action: "PAYOUT_FAILED",
                    diff: {
                      reason: failReason,
                      transactionId: id,
                      sellerId: transaction.sellerId,
                    },
                  },
                }));

                notifyPayoutFailed(
                  transaction.sellerId,
                  transaction.listing.title,
                  failReason
                ).catch(console.error);
              }
            } catch (transferError) {
              // Transfer request itself threw an error
              const errorMessage = transferError instanceof Error ? transferError.message : String(transferError);
              await withDbRetry(() => prisma.payment.update({
                where: { id: payout.id },
                data: { status: "FAILED" },
              }));

              console.error("Theteller payout error:", errorMessage);

              await withDbRetry(() => prisma.auditLog.create({
                data: {
                  entityType: "PAYMENT",
                  entityId: payout.id,
                  actorType: "SYSTEM",
                  action: "PAYOUT_FAILED",
                  diff: {
                    reason: errorMessage,
                    transactionId: id,
                    sellerId: transaction.sellerId,
                  },
                },
              }));

              notifyPayoutFailed(
                transaction.sellerId,
                transaction.listing.title,
                errorMessage
              ).catch(console.error);
            }
          }
        }

        // Update listing status to SOLD
        await withDbRetry(() => prisma.listing.update({
          where: { id: transaction.listingId },
          data: { status: "SOLD" },
        }));

        // Notify seller with net amount
        notifyTransactionReleased(
          transaction.sellerId,
          transaction.listing.title,
          Number(fees.sellerNetAmount)
        ).catch(console.error);

        // Log fee details in audit
        await withDbRetry(() => prisma.auditLog.create({
          data: {
            entityType: "TRANSACTION",
            entityId: id,
            actorType: "SYSTEM",
            action: "FEES_COLLECTED",
            diff: {
              transactionAmount: transaction.agreedPriceGhs.toString(),
              sellerFeeRate: fees.sellerFeeRate,
              sellerFeeAmount: fees.sellerFeeAmount.toString(),
              sellerNetAmount: fees.sellerNetAmount.toString(),
              subscriptionPlan: fees.subscriptionPlan,
            },
          },
        }));
      }

      return NextResponse.json({
        ...updatedTransaction,
        agreedPriceGhs: updatedTransaction.agreedPriceGhs.toString(),
        milestones: updatedTransaction.milestones.map((m) => ({
          ...m,
          amountGhs: m.amountGhs.toString(),
        })),
      });
    }

    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating transaction:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

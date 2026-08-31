import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";
import { notifyDisputeResolved, notifyPayoutProcessed, notifyPayoutFailed } from "@/lib/notifications";
import { calculateTransactionFees, createTransactionServiceCharges, markChargesCollected } from "@/lib/fees";
import { transferToMobileMoney, transferToBank, generateTransactionId } from "@/lib/theteller";
import { serializeForJson } from "@/lib/serialize";

const resolveDisputeSchema = z.object({
  outcome: z.enum(["RELEASE", "REFUND", "PARTIAL", "TERMINATE"]),
  resolutionNotes: z.string().min(10, "Resolution notes required"),
  partialBuyerAmount: z.number().optional(),
  partialSellerAmount: z.number().optional(),
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
    const data = resolveDisputeSchema.parse(body);

    // Check if user is admin
    const user = await withDbRetry(() => prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    }));

    const isAdmin = user?.roles.some((r) => ["ADMIN", "SUPPORT", "COMPLIANCE"].includes(r));
    if (!isAdmin) {
      return NextResponse.json({ error: "Only admins can resolve disputes" }, { status: 403 });
    }

    const dispute = await withDbRetry(() => prisma.dispute.findUnique({
      where: { id },
      include: {
        transaction: {
          include: {
            listing: { select: { id: true, title: true } },
            buyer: { select: { id: true, fullName: true, email: true, payoutAccountType: true, payoutAccountNumber: true, payoutAccountIssuer: true, payoutAccountBank: true } },
            seller: { select: { id: true, fullName: true, email: true, payoutAccountType: true, payoutAccountNumber: true, payoutAccountIssuer: true, payoutAccountBank: true } },
          },
        },
      },
    }));

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    if (dispute.status === "RESOLVED" || dispute.status === "CLOSED") {
      return NextResponse.json({ error: "Dispute already resolved" }, { status: 400 });
    }

    const transaction = dispute.transaction;

    // Determine new transaction status based on outcome
    let newTransactionStatus: string;
    switch (data.outcome) {
      case "RELEASE":
        newTransactionStatus = "RELEASED";
        break;
      case "REFUND":
        newTransactionStatus = "REFUNDED";
        break;
      case "PARTIAL":
        newTransactionStatus = "PARTIAL_SETTLED";
        break;
      case "TERMINATE":
        newTransactionStatus = "CLOSED";
        break;
      default:
        newTransactionStatus = "CLOSED";
    }

    // Update dispute
    const updatedDispute = await withDbRetry(() => prisma.dispute.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolutionOutcome: data.outcome,
        resolutionNotes: data.resolutionNotes,
        resolvedAt: new Date(),
      },
    }));

    // Update transaction
    await withDbRetry(() => prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: newTransactionStatus as any,
        closedAt: new Date(),
      },
    }));

    // Handle payments based on outcome
    if (data.outcome === "RELEASE") {
      // Release funds to seller (same as normal release)
      const fees = await calculateTransactionFees(
        transaction.sellerId,
        transaction.agreedPriceGhs
      );

      await createTransactionServiceCharges(
        transaction.id,
        transaction.sellerId,
        transaction.agreedPriceGhs
      );

      await markChargesCollected(transaction.id);

      // Idempotency: skip if a PAYOUT already exists for this transaction
      const existingPayout = await withDbRetry(() => prisma.payment.findFirst({
        where: { transactionId: transaction.id, type: "PAYOUT" },
      }));

      if (!existingPayout) {
        const sellerNetGhs = Number(fees.sellerNetAmount) / 100;
        const payoutTransactionId = generateTransactionId();

        if (!transaction.seller.payoutAccountType || !transaction.seller.payoutAccountNumber) {
          // Seller has no payout account configured — create PENDING payout and notify admin
          await withDbRetry(() => prisma.payment.create({
            data: {
              transactionId: transaction.id,
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
              entityType: "TRANSACTION",
              entityId: transaction.id,
              actorType: "USER",
              actorUserId: session.user.id,
              action: "PAYOUT_PENDING",
              diff: {
                reason: "Seller payout account not configured",
                disputeId: id,
              },
            },
          }));
        } else {
          const payout = await withDbRetry(() => prisma.payment.create({
            data: {
              transactionId: transaction.id,
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
            if (transaction.seller.payoutAccountType === "MOBILE_MONEY") {
              transferResult = await transferToMobileMoney({
                account_number: transaction.seller.payoutAccountNumber,
                account_issuer: transaction.seller.payoutAccountIssuer || "MTN",
                amountGhs: sellerNetGhs,
                desc: `Payout for land sale: ${transaction.listing.title}`,
                transactionId: payoutTransactionId,
              });
            } else if (transaction.seller.payoutAccountType === "BANK") {
              transferResult = await transferToBank({
                account_number: transaction.seller.payoutAccountNumber,
                account_bank: transaction.seller.payoutAccountBank || "",
                account_issuer: "GIP",
                amountGhs: sellerNetGhs,
                desc: `Payout for land sale: ${transaction.listing.title}`,
                transactionId: payoutTransactionId,
              });
            } else {
              throw new Error(`Unsupported payout account type: ${transaction.seller.payoutAccountType}`);
            }

            if (transferResult && transferResult.code === "000") {
              await withDbRetry(() => prisma.payment.update({
                where: { id: payout.id },
                data: {
                  status: "SUCCESS",
                  providerRef: transferResult.transaction_id || payoutTransactionId,
                },
              }));
              notifyPayoutProcessed(transaction.sellerId, transaction.listing.title, sellerNetGhs, transferResult.transaction_id || payoutTransactionId).catch(() => {});
            } else {
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
                  diff: { reason: failReason, disputeId: id },
                },
              }));
              notifyPayoutFailed(transaction.sellerId, transaction.listing.title, failReason).catch(() => {});
            }
          } catch (transferError) {
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
                diff: { reason: errorMessage, disputeId: id },
              },
            }));
            notifyPayoutFailed(transaction.sellerId, transaction.listing.title, errorMessage).catch(() => {});
          }
        }
      }

      // Update listing to SOLD
      await withDbRetry(() => prisma.listing.update({
        where: { id: transaction.listingId },
        data: { status: "SOLD" },
      }));
    } else if (data.outcome === "REFUND") {
      // Full refund to buyer via Theteller transfer
      const refundTransactionId = generateTransactionId();
      const refundGhs = Number(transaction.agreedPriceGhs) / 100;

      if (!transaction.buyer.payoutAccountType || !transaction.buyer.payoutAccountNumber) {
        // Buyer has no payout account configured — create PENDING refund and notify admin
        await withDbRetry(() => prisma.payment.create({
          data: {
            transactionId: transaction.id,
            provider: "THETELLER",
            type: "REFUND",
            status: "PENDING",
            amount: transaction.agreedPriceGhs,
            netAmount: transaction.agreedPriceGhs,
            payeeUserId: transaction.buyerId,
            providerRef: refundTransactionId,
          },
        }));

        await withDbRetry(() => prisma.auditLog.create({
          data: {
            entityType: "TRANSACTION",
            entityId: transaction.id,
            actorType: "USER",
            actorUserId: session.user.id,
            action: "REFUND_PENDING",
            diff: { reason: "Buyer payout account not configured", disputeId: id },
          },
        }));
      } else {
        const refund = await withDbRetry(() => prisma.payment.create({
          data: {
            transactionId: transaction.id,
            provider: "THETELLER",
            type: "REFUND",
            status: "PENDING",
            amount: transaction.agreedPriceGhs,
            netAmount: transaction.agreedPriceGhs,
            payeeUserId: transaction.buyerId,
            providerRef: refundTransactionId,
          },
        }));

        try {
          let transferResult;
          if (transaction.buyer.payoutAccountType === "MOBILE_MONEY") {
            transferResult = await transferToMobileMoney({
              account_number: transaction.buyer.payoutAccountNumber,
              account_issuer: transaction.buyer.payoutAccountIssuer || "MTN",
              amountGhs: refundGhs,
              desc: `Refund for land purchase: ${transaction.listing.title}`,
              transactionId: refundTransactionId,
            });
          } else if (transaction.buyer.payoutAccountType === "BANK") {
            transferResult = await transferToBank({
              account_number: transaction.buyer.payoutAccountNumber,
              account_bank: transaction.buyer.payoutAccountBank || "",
              account_issuer: "GIP",
              amountGhs: refundGhs,
              desc: `Refund for land purchase: ${transaction.listing.title}`,
              transactionId: refundTransactionId,
            });
          } else {
            throw new Error(`Unsupported payout account type: ${transaction.buyer.payoutAccountType}`);
          }

          if (transferResult && transferResult.code === "000") {
            await withDbRetry(() => prisma.payment.update({
              where: { id: refund.id },
              data: {
                status: "SUCCESS",
                providerRef: transferResult.transaction_id || refundTransactionId,
              },
            }));
            notifyPayoutProcessed(transaction.buyerId, transaction.listing.title, refundGhs, transferResult.transaction_id || refundTransactionId).catch(() => {});
          } else {
            const failReason = transferResult?.reason || "Transfer not approved";
            await withDbRetry(() => prisma.payment.update({
              where: { id: refund.id },
              data: { status: "FAILED" },
            }));
            console.error("Theteller refund failed:", failReason);
            await withDbRetry(() => prisma.auditLog.create({
              data: {
                entityType: "PAYMENT",
                entityId: refund.id,
                actorType: "SYSTEM",
                action: "REFUND_FAILED",
                diff: { reason: failReason, disputeId: id },
              },
            }));
            notifyPayoutFailed(transaction.buyerId, transaction.listing.title, failReason).catch(() => {});
          }
        } catch (transferError) {
          const errorMessage = transferError instanceof Error ? transferError.message : String(transferError);
          await withDbRetry(() => prisma.payment.update({
            where: { id: refund.id },
            data: { status: "FAILED" },
          }));
          console.error("Theteller refund error:", errorMessage);
          await withDbRetry(() => prisma.auditLog.create({
            data: {
              entityType: "PAYMENT",
              entityId: refund.id,
              actorType: "SYSTEM",
              action: "REFUND_FAILED",
              diff: { reason: errorMessage, disputeId: id },
            },
          }));
          notifyPayoutFailed(transaction.buyerId, transaction.listing.title, errorMessage).catch(() => {});
        }
      }

      // Re-publish listing
      await withDbRetry(() => prisma.listing.update({
        where: { id: transaction.listingId },
        data: { status: "PUBLISHED" },
      }));
    } else if (data.outcome === "PARTIAL") {
      // Partial settlement — transfer to both buyer (refund) and seller (payout)
      const buyerAmount = BigInt(Math.round((data.partialBuyerAmount || 0) * 100));
      const sellerAmount = BigInt(Math.round((data.partialSellerAmount || 0) * 100));
      const buyerGhs = (data.partialBuyerAmount || 0);
      const sellerGhs = (data.partialSellerAmount || 0);

      if (buyerAmount > 0) {
        const buyerTxId = generateTransactionId();

        if (!transaction.buyer.payoutAccountType || !transaction.buyer.payoutAccountNumber) {
          await withDbRetry(() => prisma.payment.create({
            data: {
              transactionId: transaction.id,
              provider: "THETELLER",
              type: "REFUND",
              status: "PENDING",
              amount: buyerAmount,
              netAmount: buyerAmount,
              payeeUserId: transaction.buyerId,
              providerRef: buyerTxId,
            },
          }));
          await withDbRetry(() => prisma.auditLog.create({
            data: {
              entityType: "TRANSACTION",
              entityId: transaction.id,
              actorType: "USER",
              actorUserId: session.user.id,
              action: "REFUND_PENDING",
              diff: { reason: "Buyer payout account not configured", disputeId: id },
            },
          }));
        } else {
          const buyerPayment = await withDbRetry(() => prisma.payment.create({
            data: {
              transactionId: transaction.id,
              provider: "THETELLER",
              type: "REFUND",
              status: "PENDING",
              amount: buyerAmount,
              netAmount: buyerAmount,
              payeeUserId: transaction.buyerId,
              providerRef: buyerTxId,
            },
          }));

          try {
            let buyerResult;
            if (transaction.buyer.payoutAccountType === "MOBILE_MONEY") {
              buyerResult = await transferToMobileMoney({
                account_number: transaction.buyer.payoutAccountNumber,
                account_issuer: transaction.buyer.payoutAccountIssuer || "MTN",
                amountGhs: buyerGhs,
                desc: `Partial refund for land purchase: ${transaction.listing.title}`,
                transactionId: buyerTxId,
              });
            } else if (transaction.buyer.payoutAccountType === "BANK") {
              buyerResult = await transferToBank({
                account_number: transaction.buyer.payoutAccountNumber,
                account_bank: transaction.buyer.payoutAccountBank || "",
                account_issuer: "GIP",
                amountGhs: buyerGhs,
                desc: `Partial refund for land purchase: ${transaction.listing.title}`,
                transactionId: buyerTxId,
              });
            } else {
              throw new Error(`Unsupported payout account type: ${transaction.buyer.payoutAccountType}`);
            }

            if (buyerResult && buyerResult.code === "000") {
              await withDbRetry(() => prisma.payment.update({
                where: { id: buyerPayment.id },
                data: { status: "SUCCESS", providerRef: buyerResult.transaction_id || buyerTxId },
              }));
              notifyPayoutProcessed(transaction.buyerId, transaction.listing.title, buyerGhs, buyerResult.transaction_id || buyerTxId).catch(() => {});
            } else {
              const failReason = buyerResult?.reason || "Transfer not approved";
              await withDbRetry(() => prisma.payment.update({
                where: { id: buyerPayment.id },
                data: { status: "FAILED" },
              }));
              console.error("Theteller partial refund failed:", failReason);
              await withDbRetry(() => prisma.auditLog.create({
                data: {
                  entityType: "PAYMENT",
                  entityId: buyerPayment.id,
                  actorType: "SYSTEM",
                  action: "REFUND_FAILED",
                  diff: { reason: failReason, disputeId: id },
                },
              }));
              notifyPayoutFailed(transaction.buyerId, transaction.listing.title, failReason).catch(() => {});
            }
          } catch (transferError) {
            const errorMessage = transferError instanceof Error ? transferError.message : String(transferError);
            await withDbRetry(() => prisma.payment.update({
              where: { id: buyerPayment.id },
              data: { status: "FAILED" },
            }));
            console.error("Theteller partial refund error:", errorMessage);
            await withDbRetry(() => prisma.auditLog.create({
              data: {
                entityType: "PAYMENT",
                entityId: buyerPayment.id,
                actorType: "SYSTEM",
                action: "REFUND_FAILED",
                diff: { reason: errorMessage, disputeId: id },
              },
            }));
            notifyPayoutFailed(transaction.buyerId, transaction.listing.title, errorMessage).catch(() => {});
          }
        }
      }

      if (sellerAmount > 0) {
        const sellerTxId = generateTransactionId();

        if (!transaction.seller.payoutAccountType || !transaction.seller.payoutAccountNumber) {
          await withDbRetry(() => prisma.payment.create({
            data: {
              transactionId: transaction.id,
              provider: "THETELLER",
              type: "PAYOUT",
              status: "PENDING",
              amount: sellerAmount,
              netAmount: sellerAmount,
              payeeUserId: transaction.sellerId,
              providerRef: sellerTxId,
            },
          }));
          await withDbRetry(() => prisma.auditLog.create({
            data: {
              entityType: "TRANSACTION",
              entityId: transaction.id,
              actorType: "USER",
              actorUserId: session.user.id,
              action: "PAYOUT_PENDING",
              diff: { reason: "Seller payout account not configured", disputeId: id },
            },
          }));
        } else {
          const sellerPayment = await withDbRetry(() => prisma.payment.create({
            data: {
              transactionId: transaction.id,
              provider: "THETELLER",
              type: "PAYOUT",
              status: "PENDING",
              amount: sellerAmount,
              netAmount: sellerAmount,
              payeeUserId: transaction.sellerId,
              providerRef: sellerTxId,
            },
          }));

          try {
            let sellerResult;
            if (transaction.seller.payoutAccountType === "MOBILE_MONEY") {
              sellerResult = await transferToMobileMoney({
                account_number: transaction.seller.payoutAccountNumber,
                account_issuer: transaction.seller.payoutAccountIssuer || "MTN",
                amountGhs: sellerGhs,
                desc: `Partial payout for land sale: ${transaction.listing.title}`,
                transactionId: sellerTxId,
              });
            } else if (transaction.seller.payoutAccountType === "BANK") {
              sellerResult = await transferToBank({
                account_number: transaction.seller.payoutAccountNumber,
                account_bank: transaction.seller.payoutAccountBank || "",
                account_issuer: "GIP",
                amountGhs: sellerGhs,
                desc: `Partial payout for land sale: ${transaction.listing.title}`,
                transactionId: sellerTxId,
              });
            } else {
              throw new Error(`Unsupported payout account type: ${transaction.seller.payoutAccountType}`);
            }

            if (sellerResult && sellerResult.code === "000") {
              await withDbRetry(() => prisma.payment.update({
                where: { id: sellerPayment.id },
                data: { status: "SUCCESS", providerRef: sellerResult.transaction_id || sellerTxId },
              }));
              notifyPayoutProcessed(transaction.sellerId, transaction.listing.title, sellerGhs, sellerResult.transaction_id || sellerTxId).catch(() => {});
            } else {
              const failReason = sellerResult?.reason || "Transfer not approved";
              await withDbRetry(() => prisma.payment.update({
                where: { id: sellerPayment.id },
                data: { status: "FAILED" },
              }));
              console.error("Theteller partial payout failed:", failReason);
              await withDbRetry(() => prisma.auditLog.create({
                data: {
                  entityType: "PAYMENT",
                  entityId: sellerPayment.id,
                  actorType: "SYSTEM",
                  action: "PAYOUT_FAILED",
                  diff: { reason: failReason, disputeId: id },
                },
              }));
              notifyPayoutFailed(transaction.sellerId, transaction.listing.title, failReason).catch(() => {});
            }
          } catch (transferError) {
            const errorMessage = transferError instanceof Error ? transferError.message : String(transferError);
            await withDbRetry(() => prisma.payment.update({
              where: { id: sellerPayment.id },
              data: { status: "FAILED" },
            }));
            console.error("Theteller partial payout error:", errorMessage);
            await withDbRetry(() => prisma.auditLog.create({
              data: {
                entityType: "PAYMENT",
                entityId: sellerPayment.id,
                actorType: "SYSTEM",
                action: "PAYOUT_FAILED",
                diff: { reason: errorMessage, disputeId: id },
              },
            }));
            notifyPayoutFailed(transaction.sellerId, transaction.listing.title, errorMessage).catch(() => {});
          }
        }
      }

      // Re-publish listing
      await withDbRetry(() => prisma.listing.update({
        where: { id: transaction.listingId },
        data: { status: "PUBLISHED" },
      }));
    }

    // Create audit log
    await withDbRetry(() => prisma.auditLog.create({
      data: {
        entityType: "DISPUTE",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "RESOLVE",
        diff: {
          outcome: data.outcome,
          transactionStatus: newTransactionStatus,
          notes: data.resolutionNotes,
        },
      },
    }));

    // Notify both parties
    const message = `Your dispute for "${transaction.listing.title}" has been resolved. Outcome: ${data.outcome}`;
    
    notifyDisputeResolved(transaction.buyerId, transaction.listing.title, data.outcome).catch(() => {});
    notifyDisputeResolved(transaction.sellerId, transaction.listing.title, data.outcome).catch(() => {});

    return NextResponse.json(serializeForJson({
      success: true,
      dispute: updatedDispute,
      transactionStatus: newTransactionStatus,
    }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to resolve dispute" }, { status: 500 });
  }
}

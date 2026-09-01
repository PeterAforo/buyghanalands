import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";
import { z } from "zod";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await withDbRetry(() => prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  }));
  return user?.roles.some((role) => ["ADMIN", "SUPPORT", "MODERATOR"].includes(role)) || false;
}

const updateTransactionSchema = z.object({
  status: z.enum([
    "CREATED",
    "ESCROW_REQUESTED",
    "FUNDED",
    "VERIFICATION_PERIOD",
    "DISPUTED",
    "READY_TO_RELEASE",
    "RELEASED",
    "REFUNDED",
    "CLOSED",
  ]).optional(),
  notes: z.string().optional(),
});

// Get single transaction details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const transaction = await withDbRetry(() => prisma.transaction.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            region: true,
            district: true,
            priceGhs: true,
            sizeAcres: true,
            verificationLevel: true,
          },
        },
        buyer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            kycTier: true,
            kycRequests: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, status: true, createdAt: true } },
          },
        },
        seller: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            kycTier: true,
            kycRequests: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, status: true, createdAt: true } },
          },
        },
        payments: true,
        disputes: true,
        milestones: { orderBy: { sortOrder: "asc" } },
      },
    }));

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Compute pre-release checklist
    const buyerLatestKyc = transaction.buyer.kycRequests[0];
    const sellerLatestKyc = transaction.seller.kycRequests[0];

    const buyerKycPassed =
      transaction.buyer.kycTier !== "TIER_0_OTP" &&
      (!buyerLatestKyc || buyerLatestKyc.status === "PASSED");

    const sellerKycPassed =
      transaction.seller.kycTier === "TIER_2_GHANA_CARD" &&
      (!sellerLatestKyc || sellerLatestKyc.status === "PASSED");

    // Verification period: check if enough days have passed since the first successful escrow payment
    const escrowPayment = transaction.payments.find(
      (p) => p.status === "SUCCESS" && p.type === "TRANSACTION_FUNDING"
    );
    const fundedAt = escrowPayment?.createdAt ?? null;
    const verificationDaysMin = transaction.verificationDaysMin;
    let verificationPeriodElapsed = true;
    let daysSinceFunded = 0;
    if (fundedAt) {
      const diffMs = Date.now() - new Date(fundedAt).getTime();
      daysSinceFunded = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      verificationPeriodElapsed = daysSinceFunded >= verificationDaysMin;
    }
    // If already past verification period status, consider it elapsed
    if (["READY_TO_RELEASE", "RELEASED", "REFUNDED", "CLOSED"].includes(transaction.status)) {
      verificationPeriodElapsed = true;
    }

    const allMilestonesApproved = transaction.milestones.length > 0 && transaction.milestones.every((m) => {
      const buyerOk = !!m.buyerApprovedAt || !m.requiresBuyerApproval;
      const sellerOk = !!m.sellerApprovedAt || !m.requiresSellerApproval;
      const adminOk = !!m.adminApprovedAt || !m.requiresAdminApproval;
      return buyerOk && sellerOk && adminOk;
    });

    const pendingAdminMilestones = transaction.milestones.filter(
      (m) => m.requiresAdminApproval && !m.adminApprovedAt
    ).length;

    const canRelease = buyerKycPassed && sellerKycPassed && verificationPeriodElapsed && allMilestonesApproved;

    const releaseChecklist = {
      buyerKycPassed,
      sellerKycPassed,
      verificationPeriodElapsed,
      allMilestonesApproved,
      pendingAdminMilestones,
      canRelease,
      daysSinceFunded,
      verificationDaysMin,
      buyerKycTier: transaction.buyer.kycTier,
      buyerLatestKycStatus: buyerLatestKyc?.status ?? null,
      sellerKycTier: transaction.seller.kycTier,
      sellerLatestKycStatus: sellerLatestKyc?.status ?? null,
    };

    return NextResponse.json(serializeForJson({ ...transaction, releaseChecklist }));
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json({ error: "Failed to fetch transaction" }, { status: 500 });
  }
}

// Update transaction status (moderation action)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, force } = body;

    const transaction = await withDbRetry(() => prisma.transaction.findUnique({
      where: { id },
      include: {
        buyer: { select: { id: true, kycTier: true, kycRequests: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } } } },
        seller: { select: { id: true, kycTier: true, kycRequests: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } } } },
        payments: { where: { status: "SUCCESS", type: "TRANSACTION_FUNDING" }, take: 1, select: { createdAt: true } },
        milestones: { select: { requiresBuyerApproval: true, requiresSellerApproval: true, requiresAdminApproval: true, buyerApprovedAt: true, sellerApprovedAt: true, adminApprovedAt: true } },
      },
    }));

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Pre-release checklist validation for "release" action
    if (action === "release" && !force) {
      const buyerLatestKyc = transaction.buyer.kycRequests[0];
      const sellerLatestKyc = transaction.seller.kycRequests[0];

      const buyerKycPassed =
        transaction.buyer.kycTier !== "TIER_0_OTP" &&
        (!buyerLatestKyc || buyerLatestKyc.status === "PASSED");

      const sellerKycPassed =
        transaction.seller.kycTier === "TIER_2_GHANA_CARD" &&
        (!sellerLatestKyc || sellerLatestKyc.status === "PASSED");

      const fundedAt = transaction.payments[0]?.createdAt ?? null;
      let verificationPeriodElapsed = true;
      if (fundedAt && !["READY_TO_RELEASE", "RELEASED", "REFUNDED", "CLOSED"].includes(transaction.status)) {
        const daysSince = Math.floor((Date.now() - new Date(fundedAt).getTime()) / (1000 * 60 * 60 * 24));
        verificationPeriodElapsed = daysSince >= transaction.verificationDaysMin;
      }

      const allMilestonesApproved = transaction.milestones.length > 0 && transaction.milestones.every((m) => {
        const buyerOk = !!m.buyerApprovedAt || !m.requiresBuyerApproval;
        const sellerOk = !!m.sellerApprovedAt || !m.requiresSellerApproval;
        const adminOk = !!m.adminApprovedAt || !m.requiresAdminApproval;
        return buyerOk && sellerOk && adminOk;
      });

      const failures: string[] = [];
      if (!buyerKycPassed) failures.push("Buyer KYC not passed");
      if (!sellerKycPassed) failures.push("Seller KYC not passed (requires TIER_2_GHANA_CARD)");
      if (!verificationPeriodElapsed) failures.push("Verification period not elapsed");
      if (!allMilestonesApproved) failures.push("Not all milestones approved");

      if (failures.length > 0) {
        return NextResponse.json(
          { error: "Release checklist not met", failures },
          { status: 400 }
        );
      }
    }

    type TransactionStatusType = "CREATED" | "ESCROW_REQUESTED" | "FUNDED" | "VERIFICATION_PERIOD" | "DISPUTED" | "READY_TO_RELEASE" | "RELEASED" | "REFUNDED" | "CLOSED";
    let newStatus: TransactionStatusType;

    switch (action) {
      case "release":
        newStatus = "RELEASED";
        if (newStatus === "RELEASED") {
          // Mark transaction as closed when released
        }
        break;
      case "refund":
        newStatus = "REFUNDED";
        break;
      case "close":
        newStatus = "CLOSED";
        break;
      case "dispute":
        newStatus = "DISPUTED";
        break;
      case "ready":
        newStatus = "READY_TO_RELEASE";
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updatedTransaction = await withDbRetry(() => prisma.transaction.update({
      where: { id },
      data: {
        status: newStatus,
        ...(["RELEASED", "REFUNDED", "CLOSED"].includes(newStatus) ? { closedAt: new Date() } : {}),
      },
    }));

    // Create audit log
    await withDbRetry(() => prisma.auditLog.create({
      data: {
        entityType: "TRANSACTION",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: `TRANSACTION_${action.toUpperCase()}`,
        diff: { from: transaction.status, to: newStatus, forced: !!force },
      },
    }));

    return NextResponse.json(serializeForJson(updatedTransaction));
  } catch (error) {
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

// Update transaction details (PATCH)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateTransactionSchema.parse(body);

    const existingTransaction = await withDbRetry(() => prisma.transaction.findUnique({
      where: { id },
    }));

    if (!existingTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (validatedData.status) {
      updateData.status = validatedData.status;
      if (["RELEASED", "REFUNDED", "CLOSED"].includes(validatedData.status)) {
        updateData.completedAt = new Date();
      }
    }
    if (validatedData.notes) updateData.notes = validatedData.notes;

    const updatedTransaction = await withDbRetry(() => prisma.transaction.update({
      where: { id },
      data: updateData,
    }));

    // Create audit log
    await withDbRetry(() => prisma.auditLog.create({
      data: {
        entityType: "TRANSACTION",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "TRANSACTION_UPDATED_BY_ADMIN",
        diff: { before: existingTransaction.status, changes: validatedData },
      },
    }));

    return NextResponse.json(serializeForJson(updatedTransaction));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

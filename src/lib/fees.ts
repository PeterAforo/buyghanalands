/**
 * Fee Calculation Engine
 * 
 * Handles calculation of transaction fees, service charges, and commissions
 * based on subscription tiers.
 */

import { prisma } from "./db";
import {
  getSellerTransactionFeeRate,
  getProfessionalCommissionRate,
  SELLER_PLANS,
  PROFESSIONAL_PLANS,
} from "./subscriptions";

// ============================================================================
// Type Definitions
// ============================================================================

export interface TransactionFeeCalculation {
  transactionAmount: bigint;
  sellerFeeRate: number;
  sellerFeeAmount: bigint;
  agentCommissionRate: number | null;
  agentCommissionAmount: bigint | null;
  totalDeductions: bigint;
  sellerNetAmount: bigint;
  subscriptionPlan: string | null;
}

export interface ServiceFeeCalculation {
  serviceAmount: bigint;
  commissionRate: number;
  commissionAmount: bigint;
  professionalNetAmount: bigint;
  subscriptionPlan: string | null;
}

export interface FeeBreakdown {
  label: string;
  rate: number;
  amount: bigint;
  payerId: string;
  payeeId?: string;
}

// ============================================================================
// Transaction Fee Calculation (Land Sales)
// ============================================================================

/**
 * Calculate fees for a land sale transaction
 * Fees are deducted from seller's payout at escrow release
 */
export async function calculateTransactionFees(
  sellerId: string,
  transactionAmount: bigint,
  agentId?: string
): Promise<TransactionFeeCalculation> {
  // Get seller's active subscription
  const sellerSubscription = await prisma.subscription.findFirst({
    where: {
      userId: sellerId,
      category: "SELLER",
      status: "ACTIVE",
    },
    select: {
      sellerPlan: true,
      transactionFeeRate: true,
    },
  });

  // Determine fee rate from subscription or use default
  const sellerFeeRate = sellerSubscription?.transactionFeeRate 
    ?? getSellerTransactionFeeRate(sellerSubscription?.sellerPlan ?? null);

  // Calculate seller fee
  const sellerFeeAmount = BigInt(Math.floor(Number(transactionAmount) * sellerFeeRate));

  // Calculate agent commission if applicable
  let agentCommissionRate: number | null = null;
  let agentCommissionAmount: bigint | null = null;

  if (agentId) {
    const agentProfile = await prisma.agentProfile.findUnique({
      where: { userId: agentId },
      select: { commissionRate: true },
    });

    if (agentProfile) {
      agentCommissionRate = agentProfile.commissionRate / 100; // Convert from percentage
      agentCommissionAmount = BigInt(Math.floor(Number(transactionAmount) * agentCommissionRate));
    }
  }

  // Calculate totals
  const totalDeductions = sellerFeeAmount + (agentCommissionAmount ?? BigInt(0));
  const sellerNetAmount = transactionAmount - totalDeductions;

  return {
    transactionAmount,
    sellerFeeRate,
    sellerFeeAmount,
    agentCommissionRate,
    agentCommissionAmount,
    totalDeductions,
    sellerNetAmount,
    subscriptionPlan: sellerSubscription?.sellerPlan ?? "FREE",
  };
}

/**
 * Get fee breakdown for display purposes
 */
export async function getTransactionFeeBreakdown(
  sellerId: string,
  transactionAmount: bigint,
  agentId?: string
): Promise<FeeBreakdown[]> {
  const fees = await calculateTransactionFees(sellerId, transactionAmount, agentId);
  const breakdown: FeeBreakdown[] = [];

  // Platform fee (seller pays)
  breakdown.push({
    label: `Platform Fee (${(fees.sellerFeeRate * 100).toFixed(1)}%)`,
    rate: fees.sellerFeeRate,
    amount: fees.sellerFeeAmount,
    payerId: sellerId,
  });

  // Agent commission (seller pays to agent)
  if (agentId && fees.agentCommissionAmount) {
    breakdown.push({
      label: `Agent Commission (${((fees.agentCommissionRate ?? 0) * 100).toFixed(1)}%)`,
      rate: fees.agentCommissionRate ?? 0,
      amount: fees.agentCommissionAmount,
      payerId: sellerId,
      payeeId: agentId,
    });
  }

  return breakdown;
}

// ============================================================================
// Professional Service Fee Calculation
// ============================================================================

/**
 * Calculate platform commission for a professional service
 */
export async function calculateServiceFees(
  professionalUserId: string,
  serviceAmount: bigint
): Promise<ServiceFeeCalculation> {
  // Get professional's active subscription
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: professionalUserId,
      category: "PROFESSIONAL",
      status: "ACTIVE",
    },
    select: {
      professionalPlan: true,
      serviceCommissionRate: true,
    },
  });

  // Determine commission rate from subscription or use default
  const commissionRate = subscription?.serviceCommissionRate
    ?? getProfessionalCommissionRate(subscription?.professionalPlan ?? null);

  // Calculate commission
  const commissionAmount = BigInt(Math.floor(Number(serviceAmount) * commissionRate));
  const professionalNetAmount = serviceAmount - commissionAmount;

  return {
    serviceAmount,
    commissionRate,
    commissionAmount,
    professionalNetAmount,
    subscriptionPlan: subscription?.professionalPlan ?? null,
  };
}

// ============================================================================
// Fee Rate Lookups
// ============================================================================

/**
 * Get the current transaction fee rate for a seller
 */
export async function getSellerFeeRate(sellerId: string): Promise<number> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: sellerId,
      category: "SELLER",
      status: "ACTIVE",
    },
    select: {
      sellerPlan: true,
      transactionFeeRate: true,
    },
  });

  return subscription?.transactionFeeRate
    ?? getSellerTransactionFeeRate(subscription?.sellerPlan ?? null);
}

/**
 * Get the current service commission rate for a professional
 */
export async function getProfessionalFeeRate(professionalUserId: string): Promise<number> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: professionalUserId,
      category: "PROFESSIONAL",
      status: "ACTIVE",
    },
    select: {
      professionalPlan: true,
      serviceCommissionRate: true,
    },
  });

  return subscription?.serviceCommissionRate
    ?? getProfessionalCommissionRate(subscription?.professionalPlan ?? null);
}

// ============================================================================
// Fee Estimation (for display before transaction)
// ============================================================================

/**
 * Estimate fees for a potential transaction (before it's created)
 */
export function estimateTransactionFees(
  transactionAmount: number,
  sellerPlan: string | null,
  agentCommissionRate?: number
): {
  platformFee: number;
  agentCommission: number | null;
  totalFees: number;
  sellerNet: number;
} {
  const feeRate = getSellerTransactionFeeRate(sellerPlan as any);
  const platformFee = Math.floor(transactionAmount * feeRate);
  
  let agentCommission: number | null = null;
  if (agentCommissionRate !== undefined) {
    agentCommission = Math.floor(transactionAmount * agentCommissionRate);
  }

  const totalFees = platformFee + (agentCommission ?? 0);
  const sellerNet = transactionAmount - totalFees;

  return {
    platformFee,
    agentCommission,
    totalFees,
    sellerNet,
  };
}

/**
 * Estimate service fees for a professional service
 */
export function estimateServiceFees(
  serviceAmount: number,
  professionalPlan: string | null
): {
  platformCommission: number;
  professionalNet: number;
} {
  const commissionRate = getProfessionalCommissionRate(professionalPlan as any);
  const platformCommission = Math.floor(serviceAmount * commissionRate);
  const professionalNet = serviceAmount - platformCommission;

  return {
    platformCommission,
    professionalNet,
  };
}

// ============================================================================
// Fee Collection Helpers
// ============================================================================

/**
 * Create service charge records for a transaction
 */
export async function createTransactionServiceCharges(
  transactionId: string,
  sellerId: string,
  transactionAmount: bigint,
  agentId?: string
): Promise<void> {
  const fees = await calculateTransactionFees(sellerId, transactionAmount, agentId);

  // Create seller fee charge
  await prisma.serviceCharge.create({
    data: {
      transactionId,
      chargeType: "LAND_SALE_SELLER_FEE",
      status: "PENDING",
      baseAmountGhs: transactionAmount,
      feeRate: fees.sellerFeeRate,
      feeAmountGhs: fees.sellerFeeAmount,
      payerId: sellerId,
    },
  });

  // Create agent commission charge if applicable
  if (agentId && fees.agentCommissionAmount && fees.agentCommissionRate) {
    await prisma.serviceCharge.create({
      data: {
        transactionId,
        chargeType: "AGENT_COMMISSION",
        status: "PENDING",
        baseAmountGhs: transactionAmount,
        feeRate: fees.agentCommissionRate,
        feeAmountGhs: fees.agentCommissionAmount,
        payerId: sellerId,
        payeeId: agentId,
      },
    });
  }
}

/**
 * Create service charge record for a professional booking
 */
export async function createBookingServiceCharge(
  bookingId: string,
  professionalUserId: string,
  serviceAmount: bigint
): Promise<void> {
  const fees = await calculateServiceFees(professionalUserId, serviceAmount);

  await prisma.serviceCharge.create({
    data: {
      bookingId,
      chargeType: "PROFESSIONAL_SERVICE_FEE",
      status: "PENDING",
      baseAmountGhs: serviceAmount,
      feeRate: fees.commissionRate,
      feeAmountGhs: fees.commissionAmount,
      payerId: professionalUserId,
    },
  });
}

/**
 * Mark service charges as collected
 */
export async function markChargesCollected(
  transactionId?: string,
  bookingId?: string,
  paymentRef?: string
): Promise<void> {
  const where: any = { status: "PENDING" };
  if (transactionId) where.transactionId = transactionId;
  if (bookingId) where.bookingId = bookingId;

  await prisma.serviceCharge.updateMany({
    where,
    data: {
      status: "COLLECTED",
      collectedAt: new Date(),
      paymentRef,
    },
  });
}

// ============================================================================
// Fee Summary for Reporting
// ============================================================================

/**
 * Get total fees collected for a time period
 */
export async function getFeeSummary(
  startDate: Date,
  endDate: Date
): Promise<{
  totalPlatformFees: bigint;
  totalAgentCommissions: bigint;
  totalProfessionalFees: bigint;
  transactionCount: number;
  bookingCount: number;
}> {
  const charges = await prisma.serviceCharge.findMany({
    where: {
      status: "COLLECTED",
      collectedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      chargeType: true,
      feeAmountGhs: true,
      transactionId: true,
      bookingId: true,
    },
  });

  let totalPlatformFees = BigInt(0);
  let totalAgentCommissions = BigInt(0);
  let totalProfessionalFees = BigInt(0);
  const transactionIds = new Set<string>();
  const bookingIds = new Set<string>();

  for (const charge of charges) {
    switch (charge.chargeType) {
      case "LAND_SALE_SELLER_FEE":
        totalPlatformFees += charge.feeAmountGhs;
        if (charge.transactionId) transactionIds.add(charge.transactionId);
        break;
      case "AGENT_COMMISSION":
        totalAgentCommissions += charge.feeAmountGhs;
        break;
      case "PROFESSIONAL_SERVICE_FEE":
        totalProfessionalFees += charge.feeAmountGhs;
        if (charge.bookingId) bookingIds.add(charge.bookingId);
        break;
    }
  }

  return {
    totalPlatformFees,
    totalAgentCommissions,
    totalProfessionalFees,
    transactionCount: transactionIds.size,
    bookingCount: bookingIds.size,
  };
}

// ============================================================================
// Display Helpers
// ============================================================================

/**
 * Format fee rate as percentage string
 */
export function formatFeeRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/**
 * Format fee amount for display
 */
export function formatFeeAmount(amount: bigint | number): string {
  const num = typeof amount === "bigint" ? Number(amount) : amount;
  return `GHS ${num.toLocaleString()}`;
}

/**
 * Get fee rate comparison for upgrade prompts
 */
export function getFeeRateComparison(): {
  plan: string;
  rate: number;
  savings: string;
}[] {
  const plans = Object.values(SELLER_PLANS);
  const baseRate = SELLER_PLANS.FREE.transactionFeeRate;

  return plans.map((plan) => ({
    plan: plan.name,
    rate: plan.transactionFeeRate,
    savings: plan.transactionFeeRate < baseRate
      ? `Save ${((baseRate - plan.transactionFeeRate) * 100).toFixed(1)}%`
      : "Base rate",
  }));
}

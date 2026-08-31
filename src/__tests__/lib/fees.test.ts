import {
  calculateTransactionFees,
  estimateTransactionFees,
  estimateServiceFees,
  calculateServiceFees,
  formatFeeRate,
  formatFeeAmount,
  getFeeRateComparison,
} from '@/lib/fees';

// Mock prisma and withDbRetry from db module
jest.mock('@/lib/db', () => ({
  prisma: {
    subscription: {
      findFirst: jest.fn(),
    },
    agentProfile: {
      findUnique: jest.fn(),
    },
    serviceCharge: {
      create: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
  },
  withDbRetry: jest.fn(<T>(fn: () => Promise<T>) => fn()),
}));

// Import the mocked prisma
import { prisma } from '@/lib/db';

describe('Fees Library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('estimateTransactionFees', () => {
    it('should calculate fees for FREE plan (5% rate)', () => {
      const result = estimateTransactionFees(10000, 'FREE');
      expect(result.platformFee).toBe(500); // 5% of 10000
      expect(result.agentCommission).toBeNull();
      expect(result.totalFees).toBe(500);
      expect(result.sellerNet).toBe(9500);
    });

    it('should calculate fees for PRO plan (2.5% rate)', () => {
      const result = estimateTransactionFees(10000, 'PRO');
      expect(result.platformFee).toBe(250); // 2.5% of 10000
      expect(result.sellerNet).toBe(9750);
    });

    it('should calculate fees for ENTERPRISE plan (1.5% rate)', () => {
      const result = estimateTransactionFees(10000, 'ENTERPRISE');
      expect(result.platformFee).toBe(150); // 1.5% of 10000
    });

    it('should calculate fees for STARTER plan (3.5% rate)', () => {
      const result = estimateTransactionFees(10000, 'STARTER');
      expect(result.platformFee).toBe(350); // 3.5% of 10000
    });

    it('should use FREE rate for null plan', () => {
      const result = estimateTransactionFees(10000, null);
      expect(result.platformFee).toBe(500); // 5% default
    });

    it('should include agent commission when rate is provided', () => {
      const result = estimateTransactionFees(10000, 'FREE', 0.03);
      expect(result.platformFee).toBe(500);
      expect(result.agentCommission).toBe(300); // 3% of 10000
      expect(result.totalFees).toBe(800);
      expect(result.sellerNet).toBe(9200);
    });

    it('should floor fractional amounts', () => {
      const result = estimateTransactionFees(999, 'FREE');
      // 5% of 999 = 49.95 → floored to 49
      expect(result.platformFee).toBe(49);
    });
  });

  describe('estimateServiceFees', () => {
    it('should calculate commission for BASIC plan (10%)', () => {
      const result = estimateServiceFees(1000, 'BASIC');
      expect(result.platformCommission).toBe(100);
      expect(result.professionalNet).toBe(900);
    });

    it('should calculate commission for PRO plan (7%)', () => {
      const result = estimateServiceFees(1000, 'PRO');
      expect(result.platformCommission).toBe(70);
      expect(result.professionalNet).toBe(930);
    });

    it('should calculate commission for ELITE plan (5%)', () => {
      const result = estimateServiceFees(1000, 'ELITE');
      expect(result.platformCommission).toBe(50);
      expect(result.professionalNet).toBe(950);
    });

    it('should use default rate for null plan', () => {
      const result = estimateServiceFees(1000, null);
      expect(result.platformCommission).toBe(100); // 10% default
    });
  });

  describe('calculateTransactionFees', () => {
    it('should calculate fees using subscription from DB', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        sellerPlan: 'PRO',
        transactionFeeRate: 0.025,
      });

      const result = await calculateTransactionFees('seller1', BigInt(10000));

      expect(result.transactionAmount).toBe(BigInt(10000));
      expect(result.sellerFeeRate).toBe(0.025);
      expect(result.sellerFeeAmount).toBe(BigInt(250));
      expect(result.totalDeductions).toBe(BigInt(250));
      expect(result.sellerNetAmount).toBe(BigInt(9750));
      expect(result.subscriptionPlan).toBe('PRO');
    });

    it('should use default rate when no subscription found', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await calculateTransactionFees('seller1', BigInt(10000));

      expect(result.sellerFeeRate).toBe(0.05); // FREE default
      expect(result.subscriptionPlan).toBe('FREE');
    });

    it('should calculate agent commission when agentId is provided', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        sellerPlan: 'FREE',
        transactionFeeRate: 0.05,
      });
      (prisma.agentProfile.findUnique as jest.Mock).mockResolvedValue({
        commissionRate: 3, // 3%
      });

      const result = await calculateTransactionFees('seller1', BigInt(10000), 'agent1');

      expect(result.agentCommissionRate).toBe(0.03);
      expect(result.agentCommissionAmount).toBe(BigInt(300));
      expect(result.totalDeductions).toBe(BigInt(800)); // 500 + 300
      expect(result.sellerNetAmount).toBe(BigInt(9200));
    });

    it('should not add agent commission when agent profile not found', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        sellerPlan: 'FREE',
        transactionFeeRate: 0.05,
      });
      (prisma.agentProfile.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await calculateTransactionFees('seller1', BigInt(10000), 'agent1');

      expect(result.agentCommissionRate).toBeNull();
      expect(result.agentCommissionAmount).toBeNull();
      expect(result.totalDeductions).toBe(BigInt(500));
    });
  });

  describe('calculateServiceFees', () => {
    it('should calculate commission using subscription from DB', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        professionalPlan: 'PRO',
        serviceCommissionRate: 0.07,
      });

      const result = await calculateServiceFees('prof1', BigInt(1000));

      expect(result.commissionRate).toBe(0.07);
      expect(result.commissionAmount).toBe(BigInt(70));
      expect(result.professionalNetAmount).toBe(BigInt(930));
      expect(result.subscriptionPlan).toBe('PRO');
    });

    it('should use default rate when no subscription found', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await calculateServiceFees('prof1', BigInt(1000));

      expect(result.commissionRate).toBe(0.10); // BASIC default
      expect(result.subscriptionPlan).toBeNull();
    });
  });

  describe('formatFeeRate', () => {
    it('should format rate as percentage string', () => {
      expect(formatFeeRate(0.05)).toBe('5.0%');
      expect(formatFeeRate(0.025)).toBe('2.5%');
      expect(formatFeeRate(0.015)).toBe('1.5%');
    });
  });

  describe('formatFeeAmount', () => {
    it('should format bigint amount', () => {
      expect(formatFeeAmount(BigInt(1000))).toContain('1,000');
      expect(formatFeeAmount(BigInt(1000))).toContain('GHS');
    });

    it('should format number amount', () => {
      expect(formatFeeAmount(500)).toContain('500');
      expect(formatFeeAmount(500)).toContain('GHS');
    });
  });

  describe('getFeeRateComparison', () => {
    it('should return comparison for all seller plans', () => {
      const comparison = getFeeRateComparison();
      expect(comparison.length).toBeGreaterThanOrEqual(4);

      const freePlan = comparison.find((c) => c.plan === 'Free');
      expect(freePlan).toBeDefined();
      expect(freePlan?.rate).toBe(0.05);
      expect(freePlan?.savings).toBe('Base rate');
    });

    it('should show savings for plans with lower rate', () => {
      const comparison = getFeeRateComparison();
      const proPlan = comparison.find((c) => c.plan === 'Pro');
      expect(proPlan).toBeDefined();
      expect(proPlan?.savings).toContain('Save');
    });
  });
});

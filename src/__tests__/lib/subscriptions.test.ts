import {
  BUYER_PLANS,
  SELLER_PLANS,
  AGENT_PLANS,
  PROFESSIONAL_PLANS,
  getPlanConfig,
  getPlanPrice,
  getPlansForCategory,
  getSellerTransactionFeeRate,
  getProfessionalCommissionRate,
  getSellerListingLimit,
  getAgentClientLimit,
  getProfessionalLeadLimit,
  planHasFeature,
  calculateEndDate,
  isSubscriptionExpired,
  getDaysUntilExpiry,
  formatSubscriptionPrice,
  getDefaultFreePlan,
  requiresPaidSubscription,
} from '@/lib/subscriptions';

describe('Subscriptions Library', () => {
  describe('Plan Constants', () => {
    it('should have all buyer plans defined', () => {
      expect(BUYER_PLANS.FREE).toBeDefined();
      expect(BUYER_PLANS.PREMIUM).toBeDefined();
      expect(BUYER_PLANS.VIP).toBeDefined();
    });

    it('should have all seller plans defined', () => {
      expect(SELLER_PLANS.FREE).toBeDefined();
      expect(SELLER_PLANS.STARTER).toBeDefined();
      expect(SELLER_PLANS.PRO).toBeDefined();
      expect(SELLER_PLANS.ENTERPRISE).toBeDefined();
    });

    it('should have all agent plans defined', () => {
      expect(AGENT_PLANS.BASIC).toBeDefined();
      expect(AGENT_PLANS.PRO).toBeDefined();
      expect(AGENT_PLANS.ELITE).toBeDefined();
    });

    it('should have all professional plans defined', () => {
      expect(PROFESSIONAL_PLANS.BASIC).toBeDefined();
      expect(PROFESSIONAL_PLANS.PRO).toBeDefined();
      expect(PROFESSIONAL_PLANS.ELITE).toBeDefined();
    });
  });

  describe('getPlanConfig', () => {
    it('should return buyer plan config', () => {
      const config = getPlanConfig('BUYER', 'FREE');
      expect(config).toBeDefined();
      expect(config?.name).toBe('Free');
    });

    it('should return seller plan config', () => {
      const config = getPlanConfig('SELLER', 'PRO');
      expect(config).toBeDefined();
      expect(config?.name).toBe('Pro');
    });

    it('should return null for invalid plan', () => {
      const config = getPlanConfig('BUYER', 'INVALID' as any);
      expect(config).toBeNull();
    });
  });

  describe('getPlanPrice', () => {
    it('should return monthly price', () => {
      const price = getPlanPrice('BUYER', 'PREMIUM', 'MONTHLY');
      expect(price).toBe(30);
    });

    it('should return yearly price', () => {
      const price = getPlanPrice('BUYER', 'PREMIUM', 'YEARLY');
      expect(price).toBe(300);
    });

    it('should return 0 for free plans', () => {
      expect(getPlanPrice('BUYER', 'FREE', 'MONTHLY')).toBe(0);
      expect(getPlanPrice('SELLER', 'FREE', 'YEARLY')).toBe(0);
    });
  });

  describe('getPlansForCategory', () => {
    it('should return all buyer plans', () => {
      const plans = getPlansForCategory('BUYER');
      expect(plans.length).toBe(3);
    });

    it('should return all seller plans', () => {
      const plans = getPlansForCategory('SELLER');
      expect(plans.length).toBe(4);
    });

    it('should return empty array for invalid category', () => {
      const plans = getPlansForCategory('INVALID' as any);
      expect(plans).toEqual([]);
    });
  });

  describe('getSellerTransactionFeeRate', () => {
    it('should return fee rate for FREE plan', () => {
      expect(getSellerTransactionFeeRate('FREE')).toBe(0.05);
    });

    it('should return fee rate for PRO plan', () => {
      expect(getSellerTransactionFeeRate('PRO')).toBe(0.025);
    });

    it('should return default fee rate for null', () => {
      expect(getSellerTransactionFeeRate(null)).toBe(0.05);
    });
  });

  describe('getSellerListingLimit', () => {
    it('should return 1 for FREE plan', () => {
      expect(getSellerListingLimit('FREE')).toBe(1);
    });

    it('should return -1 (unlimited) for ENTERPRISE plan', () => {
      expect(getSellerListingLimit('ENTERPRISE')).toBe(-1);
    });

    it('should return default limit for null', () => {
      expect(getSellerListingLimit(null)).toBe(1);
    });
  });

  describe('getAgentClientLimit', () => {
    it('should return limit for BASIC plan', () => {
      expect(getAgentClientLimit('BASIC')).toBe(10);
    });

    it('should return -1 (unlimited) for ELITE plan', () => {
      expect(getAgentClientLimit('ELITE')).toBe(-1);
    });
  });

  describe('getProfessionalLeadLimit', () => {
    it('should return limit for BASIC plan', () => {
      expect(getProfessionalLeadLimit('BASIC')).toBe(5);
    });

    it('should return -1 (unlimited) for ELITE plan', () => {
      expect(getProfessionalLeadLimit('ELITE')).toBe(-1);
    });
  });

  describe('planHasFeature', () => {
    it('should return true for existing feature', () => {
      expect(planHasFeature('BUYER', 'FREE', 'browseListings')).toBe(true);
    });

    it('should return false for non-existing feature', () => {
      expect(planHasFeature('BUYER', 'FREE', 'prioritySupport')).toBe(false);
    });

    it('should return true for premium feature on premium plan', () => {
      expect(planHasFeature('BUYER', 'PREMIUM', 'prioritySupport')).toBe(true);
    });
  });

  describe('calculateEndDate', () => {
    it('should add 1 month for MONTHLY billing', () => {
      const start = new Date('2024-01-15');
      const end = calculateEndDate(start, 'MONTHLY');
      expect(end.getMonth()).toBe(1); // February
    });

    it('should add 1 year for YEARLY billing', () => {
      const start = new Date('2024-01-15');
      const end = calculateEndDate(start, 'YEARLY');
      expect(end.getFullYear()).toBe(2025);
    });
  });

  describe('isSubscriptionExpired', () => {
    it('should return true for past date', () => {
      const pastDate = new Date('2020-01-01');
      expect(isSubscriptionExpired(pastDate)).toBe(true);
    });

    it('should return false for future date', () => {
      const futureDate = new Date('2030-01-01');
      expect(isSubscriptionExpired(futureDate)).toBe(false);
    });
  });

  describe('getDaysUntilExpiry', () => {
    it('should return positive days for future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const days = getDaysUntilExpiry(futureDate);
      expect(days).toBeGreaterThanOrEqual(9);
      expect(days).toBeLessThanOrEqual(11);
    });

    it('should return negative days for past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const days = getDaysUntilExpiry(pastDate);
      expect(days).toBeLessThan(0);
    });
  });

  describe('formatSubscriptionPrice', () => {
    it('should return "Free" for 0', () => {
      expect(formatSubscriptionPrice(0)).toBe('Free');
    });

    it('should format price with GHS prefix', () => {
      expect(formatSubscriptionPrice(100)).toBe('GHS 100');
    });

    it('should format large numbers with commas', () => {
      expect(formatSubscriptionPrice(1000)).toBe('GHS 1,000');
    });
  });

  describe('getDefaultFreePlan', () => {
    it('should return FREE for BUYER', () => {
      expect(getDefaultFreePlan('BUYER')).toBe('FREE');
    });

    it('should return FREE for SELLER', () => {
      expect(getDefaultFreePlan('SELLER')).toBe('FREE');
    });

    it('should return null for AGENT', () => {
      expect(getDefaultFreePlan('AGENT')).toBeNull();
    });

    it('should return null for PROFESSIONAL', () => {
      expect(getDefaultFreePlan('PROFESSIONAL')).toBeNull();
    });
  });

  describe('requiresPaidSubscription', () => {
    it('should return false for BUYER', () => {
      expect(requiresPaidSubscription('BUYER')).toBe(false);
    });

    it('should return false for SELLER', () => {
      expect(requiresPaidSubscription('SELLER')).toBe(false);
    });

    it('should return true for AGENT', () => {
      expect(requiresPaidSubscription('AGENT')).toBe(true);
    });

    it('should return true for PROFESSIONAL', () => {
      expect(requiresPaidSubscription('PROFESSIONAL')).toBe(true);
    });
  });
});

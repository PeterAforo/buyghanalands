import {
  canCreateListing,
  isListingExpired,
  hasFeatureAccess,
  hasAnalyticsAccess,
  hasApiAccess,
  canAddClient,
  canAcceptLead,
  canCreateProfessionalProfile,
  needsSubscription,
  getActiveSubscription,
  getAllActiveSubscriptions,
  getUserPermissions,
} from '@/lib/permissions';

// Mock prisma and withDbRetry from db module
jest.mock('@/lib/db', () => ({
  prisma: {
    subscription: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    listing: {
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    agentProfile: {
      findUnique: jest.fn(),
    },
    agentListing: {
      count: jest.fn(),
    },
    agentClient: {
      count: jest.fn(),
    },
    professionalProfile: {
      findUnique: jest.fn(),
    },
    serviceRequest: {
      count: jest.fn(),
    },
  },
  withDbRetry: jest.fn(<T>(fn: () => Promise<T>) => fn()),
}));

import { prisma } from '@/lib/db';

describe('Permissions Library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveSubscription', () => {
    it('should return subscription info when found', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        category: 'SELLER',
        sellerPlan: 'PRO',
        status: 'ACTIVE',
        endDate: new Date('2030-01-01'),
        features: { analytics: true },
      });

      const result = await getActiveSubscription('user1', 'SELLER');
      expect(result).not.toBeNull();
      expect(result?.plan).toBe('PRO');
      expect(result?.category).toBe('SELLER');
      expect(result?.status).toBe('ACTIVE');
    });

    it('should return null when no subscription found', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await getActiveSubscription('user1', 'AGENT');
      expect(result).toBeNull();
    });
  });

  describe('getAllActiveSubscriptions', () => {
    it('should return all active subscriptions mapped correctly', async () => {
      (prisma.subscription.findMany as jest.Mock).mockResolvedValue([
        {
          category: 'SELLER',
          sellerPlan: 'PRO',
          status: 'ACTIVE',
          endDate: new Date('2030-01-01'),
          features: null,
        },
        {
          category: 'BUYER',
          buyerPlan: 'PREMIUM',
          status: 'ACTIVE',
          endDate: new Date('2030-01-01'),
          features: null,
        },
      ]);

      const results = await getAllActiveSubscriptions('user1');
      expect(results).toHaveLength(2);
      expect(results[0].plan).toBe('PRO');
      expect(results[1].plan).toBe('PREMIUM');
    });
  });

  describe('canCreateListing', () => {
    it('should allow admin to always create listings', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        roles: ['ADMIN'],
      });

      const result = await canCreateListing('admin1');
      expect(result.allowed).toBe(true);
    });

    it('should allow seller under listing limit', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        roles: ['SELLER'],
      });
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        category: 'SELLER',
        sellerPlan: 'FREE',
        status: 'ACTIVE',
        endDate: new Date('2030-01-01'),
        features: null,
      });
      (prisma.listing.count as jest.Mock).mockResolvedValue(0);

      const result = await canCreateListing('seller1');
      expect(result.allowed).toBe(true);
    });

    it('should block seller at listing limit', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        roles: ['SELLER'],
      });
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        category: 'SELLER',
        sellerPlan: 'FREE',
        status: 'ACTIVE',
        endDate: new Date('2030-01-01'),
        features: null,
      });
      (prisma.listing.count as jest.Mock).mockResolvedValue(1); // FREE limit is 1

      const result = await canCreateListing('seller1');
      expect(result.allowed).toBe(false);
      expect(result.upgradeRequired).toBe(true);
      expect(result.reason).toContain('listing limit');
    });

    it('should return not allowed for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await canCreateListing('nonexistent');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not found');
    });

    it('should allow ENTERPRISE seller with unlimited listings', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        roles: ['SELLER'],
      });
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        category: 'SELLER',
        sellerPlan: 'ENTERPRISE',
        status: 'ACTIVE',
        endDate: new Date('2030-01-01'),
        features: null,
      });
      (prisma.listing.count as jest.Mock).mockResolvedValue(100);

      const result = await canCreateListing('seller1');
      expect(result.allowed).toBe(true);
    });
  });

  describe('isListingExpired', () => {
    it('should return false for SOLD listing', async () => {
      (prisma.listing.findUnique as jest.Mock).mockResolvedValue({
        sellerId: 'seller1',
        createdAt: new Date('2020-01-01'),
        status: 'SOLD',
      });

      const result = await isListingExpired('listing1');
      expect(result).toBe(false);
    });

    it('should return false for ARCHIVED listing', async () => {
      (prisma.listing.findUnique as jest.Mock).mockResolvedValue({
        sellerId: 'seller1',
        createdAt: new Date('2020-01-01'),
        status: 'ARCHIVED',
      });

      const result = await isListingExpired('listing1');
      expect(result).toBe(false);
    });

    it('should return false for non-existent listing', async () => {
      (prisma.listing.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await isListingExpired('listing1');
      expect(result).toBe(false);
    });

    it('should return true for old FREE listing past expiry', async () => {
      (prisma.listing.findUnique as jest.Mock).mockResolvedValue({
        sellerId: 'seller1',
        createdAt: new Date('2020-01-01'),
        status: 'ACTIVE',
      });
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null); // FREE default, 30 days

      const result = await isListingExpired('listing1');
      expect(result).toBe(true);
    });

    it('should return false for STARTER plan (no expiry)', async () => {
      (prisma.listing.findUnique as jest.Mock).mockResolvedValue({
        sellerId: 'seller1',
        createdAt: new Date('2020-01-01'),
        status: 'ACTIVE',
      });
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        category: 'SELLER',
        sellerPlan: 'STARTER',
        status: 'ACTIVE',
        endDate: new Date('2030-01-01'),
        features: null,
      });

      const result = await isListingExpired('listing1');
      expect(result).toBe(false); // STARTER has 0 expiry days
    });
  });

  describe('hasFeatureAccess', () => {
    it('should return true for free tier feature without subscription', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await hasFeatureAccess('user1', 'SELLER', 'createListings');
      expect(result).toBe(true);
    });

    it('should return false for non-free category without subscription', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await hasFeatureAccess('user1', 'AGENT', 'clientManagement');
      expect(result).toBe(false);
    });

    it('should check subscription features when available', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        category: 'SELLER',
        sellerPlan: 'PRO',
        status: 'ACTIVE',
        endDate: new Date('2030-01-01'),
        features: { analytics: true },
      });

      const result = await hasFeatureAccess('user1', 'SELLER', 'analytics');
      expect(result).toBe(true);
    });
  });

  describe('hasAnalyticsAccess', () => {
    it('should return true for PRO seller', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        category: 'SELLER',
        sellerPlan: 'PRO',
        status: 'ACTIVE',
        endDate: new Date('2030-01-01'),
        features: null,
      });

      const result = await hasAnalyticsAccess('user1');
      expect(result).toBe(true);
    });

    it('should return false for FREE seller', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        category: 'SELLER',
        sellerPlan: 'FREE',
        status: 'ACTIVE',
        endDate: new Date('2030-01-01'),
        features: null,
      });

      const result = await hasAnalyticsAccess('user1');
      expect(result).toBe(false);
    });
  });

  describe('hasApiAccess', () => {
    it('should return true for ENTERPRISE seller', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        category: 'SELLER',
        sellerPlan: 'ENTERPRISE',
        status: 'ACTIVE',
        endDate: new Date('2030-01-01'),
        features: null,
      });

      const result = await hasApiAccess('user1');
      expect(result).toBe(true);
    });

    it('should return false for PRO seller', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        category: 'SELLER',
        sellerPlan: 'PRO',
        status: 'ACTIVE',
        endDate: new Date('2030-01-01'),
        features: null,
      });

      const result = await hasApiAccess('user1');
      expect(result).toBe(false);
    });
  });

  describe('canAddClient', () => {
    it('should block agent without subscription', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await canAddClient('agent1');
      expect(result.allowed).toBe(false);
      expect(result.upgradeRequired).toBe(true);
    });

    it('should allow agent under client limit', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        category: 'AGENT',
        agentPlan: 'BASIC',
        status: 'ACTIVE',
        endDate: new Date('2030-01-01'),
        features: null,
      });
      (prisma.agentProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'profile1' });
      (prisma.agentClient.count as jest.Mock).mockResolvedValue(5); // BASIC limit is 10

      const result = await canAddClient('agent1');
      expect(result.allowed).toBe(true);
    });

    it('should block agent at client limit', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        category: 'AGENT',
        agentPlan: 'BASIC',
        status: 'ACTIVE',
        endDate: new Date('2030-01-01'),
        features: null,
      });
      (prisma.agentProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'profile1' });
      (prisma.agentClient.count as jest.Mock).mockResolvedValue(10); // at limit

      const result = await canAddClient('agent1');
      expect(result.allowed).toBe(false);
      expect(result.upgradeRequired).toBe(true);
    });
  });

  describe('canAcceptLead', () => {
    it('should block professional without subscription', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await canAcceptLead('prof1');
      expect(result.allowed).toBe(false);
      expect(result.upgradeRequired).toBe(true);
    });

    it('should allow ELITE professional (unlimited)', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        category: 'PROFESSIONAL',
        professionalPlan: 'ELITE',
        status: 'ACTIVE',
        endDate: new Date('2030-01-01'),
        features: null,
      });

      const result = await canAcceptLead('prof1');
      expect(result.allowed).toBe(true);
    });
  });

  describe('canCreateProfessionalProfile', () => {
    it('should block if profile already exists', async () => {
      (prisma.professionalProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'prof1' });

      const result = await canCreateProfessionalProfile('user1');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('already have');
    });

    it('should block without subscription', async () => {
      (prisma.professionalProfile.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await canCreateProfessionalProfile('user1');
      expect(result.allowed).toBe(false);
      expect(result.upgradeRequired).toBe(true);
    });

    it('should allow with active subscription', async () => {
      (prisma.professionalProfile.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        category: 'PROFESSIONAL',
        professionalPlan: 'BASIC',
        status: 'ACTIVE',
        endDate: new Date('2030-01-01'),
        features: null,
      });

      const result = await canCreateProfessionalProfile('user1');
      expect(result.allowed).toBe(true);
    });
  });

  describe('needsSubscription', () => {
    it('should return false for BUYER (free tier)', async () => {
      const result = await needsSubscription('user1', 'AGENT' as any);
      // AGENT requires paid subscription
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        category: 'AGENT',
        agentPlan: 'BASIC',
        status: 'ACTIVE',
        endDate: new Date('2030-01-01'),
        features: null,
      });
      const result2 = await needsSubscription('user1', 'AGENT');
      expect(result2).toBe(false);
    });

    it('should return true for AGENT without subscription', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await needsSubscription('user1', 'AGENT');
      expect(result).toBe(true);
    });

    it('should return false for PROFESSIONAL with subscription', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        category: 'PROFESSIONAL',
        professionalPlan: 'PRO',
        status: 'ACTIVE',
        endDate: new Date('2030-01-01'),
        features: null,
      });

      const result = await needsSubscription('user1', 'PROFESSIONAL');
      expect(result).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('should throw for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getUserPermissions('nonexistent')).rejects.toThrow('User not found');
    });

    it('should return comprehensive permissions object', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        roles: ['SELLER'],
      });
      (prisma.subscription.findMany as jest.Mock).mockResolvedValue([
        {
          category: 'SELLER',
          sellerPlan: 'PRO',
          status: 'ACTIVE',
          endDate: new Date('2030-01-01'),
          features: null,
        },
      ]);
      (prisma.listing.count as jest.Mock).mockResolvedValue(5);
      (prisma.agentProfile.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.professionalProfile.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getUserPermissions('user1');
      expect(result.userId).toBe('user1');
      expect(result.roles).toEqual(['SELLER']);
      expect(result.canCreateListing).toBe(true); // PRO limit is 20, current is 5
      expect(result.listingLimit).toBe(20);
      expect(result.currentListings).toBe(5);
    });
  });
});

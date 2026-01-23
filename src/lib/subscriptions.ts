/**
 * Subscription Plan Configuration
 * 
 * Defines all subscription tiers for Buyer, Seller, Agent, and Professional users.
 * Includes pricing, features, limits, and fee rates.
 */

// Type definitions for subscription system
// These match the enums defined in prisma/schema.prisma
// After running `npx prisma generate`, you can import these from @prisma/client instead

export type SubscriptionCategory = "BUYER" | "SELLER" | "AGENT" | "PROFESSIONAL";
export type BuyerPlan = "FREE" | "PREMIUM" | "VIP";
export type SellerPlan = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";
export type AgentPlan = "BASIC" | "PRO" | "ELITE";
export type ProfessionalPlan = "BASIC" | "PRO" | "ELITE";
export type BillingCycle = "MONTHLY" | "YEARLY";

// ============================================================================
// Type Definitions
// ============================================================================

export interface PlanFeatures {
  [key: string]: boolean | number | string;
}

export interface BasePlanConfig {
  name: string;
  description: string;
  monthlyPrice: number;  // GHS
  yearlyPrice: number;   // GHS (typically 10 months for yearly)
  features: PlanFeatures;
  popular?: boolean;
}

export interface BuyerPlanConfig extends BasePlanConfig {
  plan: BuyerPlan;
  savedSearchLimit: number;
  alertLimit: number;
}

export interface SellerPlanConfig extends BasePlanConfig {
  plan: SellerPlan;
  listingLimit: number;           // -1 for unlimited
  listingExpiryDays: number;      // Days before listing expires (0 = no expiry)
  transactionFeeRate: number;     // Fee rate on land sales (e.g., 0.05 = 5%)
  featuredListingsIncluded: number;
}

export interface AgentPlanConfig extends BasePlanConfig {
  plan: AgentPlan;
  clientLimit: number;            // Max clients
  listingLimit: number;           // Max managed listings
  commissionRate: number;         // Default commission rate
}

export interface ProfessionalPlanConfig extends BasePlanConfig {
  plan: ProfessionalPlan;
  leadLimit: number;              // Leads per month (-1 for unlimited)
  serviceCommissionRate: number;  // Platform commission on services
  profilePriority: number;        // Higher = better placement
}

// ============================================================================
// Buyer Plans
// ============================================================================

export const BUYER_PLANS: Record<BuyerPlan, BuyerPlanConfig> = {
  FREE: {
    plan: "FREE",
    name: "Free",
    description: "Basic access to browse and search listings",
    monthlyPrice: 0,
    yearlyPrice: 0,
    savedSearchLimit: 3,
    alertLimit: 5,
    features: {
      browseListings: true,
      basicAlerts: true,
      savedSearches: true,
      messaging: true,
      escrowProtection: true,
      prioritySupport: false,
      earlyAccess: false,
      dedicatedAgent: false,
      freeDocVerification: false,
    },
  },
  PREMIUM: {
    plan: "PREMIUM",
    name: "Premium",
    description: "Enhanced features for serious buyers",
    monthlyPrice: 30,
    yearlyPrice: 300,
    savedSearchLimit: 20,
    alertLimit: 50,
    popular: true,
    features: {
      browseListings: true,
      basicAlerts: true,
      instantAlerts: true,
      savedSearches: true,
      unlimitedSavedSearches: true,
      messaging: true,
      escrowProtection: true,
      prioritySupport: true,
      escrowInsuranceDiscount: true,
      earlyAccess: false,
      dedicatedAgent: false,
      freeDocVerification: false,
    },
  },
  VIP: {
    plan: "VIP",
    name: "VIP",
    description: "Premium experience with exclusive benefits",
    monthlyPrice: 100,
    yearlyPrice: 1000,
    savedSearchLimit: -1, // Unlimited
    alertLimit: -1,       // Unlimited
    features: {
      browseListings: true,
      basicAlerts: true,
      instantAlerts: true,
      savedSearches: true,
      unlimitedSavedSearches: true,
      messaging: true,
      escrowProtection: true,
      prioritySupport: true,
      escrowInsuranceDiscount: true,
      earlyAccess: true,
      dedicatedAgent: true,
      freeDocVerification: true,
      vipBadge: true,
    },
  },
};

// ============================================================================
// Seller Plans
// ============================================================================

export const SELLER_PLANS: Record<SellerPlan, SellerPlanConfig> = {
  FREE: {
    plan: "FREE",
    name: "Free",
    description: "Get started with one listing",
    monthlyPrice: 0,
    yearlyPrice: 0,
    listingLimit: 1,
    listingExpiryDays: 30,
    transactionFeeRate: 0.05,  // 5%
    featuredListingsIncluded: 0,
    features: {
      createListings: true,
      basicVisibility: true,
      messaging: true,
      escrowProtection: true,
      analytics: false,
      featuredPlacement: false,
      prioritySupport: false,
      verifiedBadge: false,
      apiAccess: false,
    },
  },
  STARTER: {
    plan: "STARTER",
    name: "Starter",
    description: "For individual sellers with multiple properties",
    monthlyPrice: 50,
    yearlyPrice: 500,
    listingLimit: 5,
    listingExpiryDays: 0, // No expiry
    transactionFeeRate: 0.035,  // 3.5%
    featuredListingsIncluded: 0,
    features: {
      createListings: true,
      basicVisibility: true,
      standardVisibility: true,
      messaging: true,
      escrowProtection: true,
      analytics: false,
      featuredPlacement: false,
      prioritySupport: false,
      verifiedBadge: false,
      apiAccess: false,
    },
  },
  PRO: {
    plan: "PRO",
    name: "Pro",
    description: "For active sellers and small agencies",
    monthlyPrice: 150,
    yearlyPrice: 1500,
    listingLimit: 20,
    listingExpiryDays: 0,
    transactionFeeRate: 0.025,  // 2.5%
    featuredListingsIncluded: 2,
    popular: true,
    features: {
      createListings: true,
      basicVisibility: true,
      standardVisibility: true,
      enhancedVisibility: true,
      messaging: true,
      escrowProtection: true,
      analytics: true,
      featuredPlacement: true,
      prioritySupport: true,
      verifiedBadge: true,
      apiAccess: false,
    },
  },
  ENTERPRISE: {
    plan: "ENTERPRISE",
    name: "Enterprise",
    description: "For large agencies and developers",
    monthlyPrice: 500,
    yearlyPrice: 5000,
    listingLimit: -1, // Unlimited
    listingExpiryDays: 0,
    transactionFeeRate: 0.015,  // 1.5%
    featuredListingsIncluded: 10,
    features: {
      createListings: true,
      basicVisibility: true,
      standardVisibility: true,
      enhancedVisibility: true,
      premiumVisibility: true,
      messaging: true,
      escrowProtection: true,
      analytics: true,
      advancedAnalytics: true,
      featuredPlacement: true,
      prioritySupport: true,
      dedicatedSupport: true,
      verifiedBadge: true,
      apiAccess: true,
      whiteLabel: true,
    },
  },
};

// ============================================================================
// Agent Plans
// ============================================================================

export const AGENT_PLANS: Record<AgentPlan, AgentPlanConfig> = {
  BASIC: {
    plan: "BASIC",
    name: "Basic",
    description: "Start your real estate agency",
    monthlyPrice: 100,
    yearlyPrice: 1000,
    clientLimit: 10,
    listingLimit: 15,
    commissionRate: 0.05,  // 5% default
    features: {
      clientManagement: true,
      listingManagement: true,
      messaging: true,
      basicAnalytics: true,
      leadGeneration: false,
      verifiedBadge: false,
      prioritySupport: false,
      teamMembers: false,
    },
  },
  PRO: {
    plan: "PRO",
    name: "Pro",
    description: "Grow your agency with advanced tools",
    monthlyPrice: 300,
    yearlyPrice: 3000,
    clientLimit: 50,
    listingLimit: 50,
    commissionRate: 0.05,
    popular: true,
    features: {
      clientManagement: true,
      listingManagement: true,
      messaging: true,
      basicAnalytics: true,
      advancedAnalytics: true,
      leadGeneration: true,
      verifiedBadge: true,
      prioritySupport: true,
      teamMembers: false,
      crm: true,
    },
  },
  ELITE: {
    plan: "ELITE",
    name: "Elite",
    description: "Full-featured agency management",
    monthlyPrice: 750,
    yearlyPrice: 7500,
    clientLimit: -1, // Unlimited
    listingLimit: -1,
    commissionRate: 0.05,
    features: {
      clientManagement: true,
      listingManagement: true,
      messaging: true,
      basicAnalytics: true,
      advancedAnalytics: true,
      leadGeneration: true,
      premiumLeadGeneration: true,
      verifiedBadge: true,
      eliteBadge: true,
      prioritySupport: true,
      dedicatedSupport: true,
      teamMembers: true,
      crm: true,
      apiAccess: true,
    },
  },
};

// ============================================================================
// Professional Plans
// ============================================================================

export const PROFESSIONAL_PLANS: Record<ProfessionalPlan, ProfessionalPlanConfig> = {
  BASIC: {
    plan: "BASIC",
    name: "Basic",
    description: "List your professional services",
    monthlyPrice: 75,
    yearlyPrice: 750,
    leadLimit: 5,
    serviceCommissionRate: 0.10,  // 10%
    profilePriority: 1,
    features: {
      profileListing: true,
      serviceListings: true,
      messaging: true,
      basicAnalytics: true,
      featuredProfile: false,
      verifiedBadge: false,
      prioritySupport: false,
    },
  },
  PRO: {
    plan: "PRO",
    name: "Pro",
    description: "Grow your professional practice",
    monthlyPrice: 200,
    yearlyPrice: 2000,
    leadLimit: 20,
    serviceCommissionRate: 0.07,  // 7%
    profilePriority: 5,
    popular: true,
    features: {
      profileListing: true,
      serviceListings: true,
      messaging: true,
      basicAnalytics: true,
      advancedAnalytics: true,
      featuredProfile: true,
      verifiedBadge: true,
      prioritySupport: true,
      portfolioShowcase: true,
    },
  },
  ELITE: {
    plan: "ELITE",
    name: "Elite",
    description: "Maximum visibility and lowest fees",
    monthlyPrice: 500,
    yearlyPrice: 5000,
    leadLimit: -1, // Unlimited
    serviceCommissionRate: 0.05,  // 5%
    profilePriority: 10,
    features: {
      profileListing: true,
      serviceListings: true,
      messaging: true,
      basicAnalytics: true,
      advancedAnalytics: true,
      featuredProfile: true,
      topPlacement: true,
      verifiedBadge: true,
      eliteBadge: true,
      prioritySupport: true,
      dedicatedSupport: true,
      portfolioShowcase: true,
      apiAccess: true,
    },
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get plan configuration by category and plan
 */
export function getPlanConfig(
  category: SubscriptionCategory,
  plan: BuyerPlan | SellerPlan | AgentPlan | ProfessionalPlan
): BasePlanConfig | null {
  switch (category) {
    case "BUYER":
      return BUYER_PLANS[plan as BuyerPlan] || null;
    case "SELLER":
      return SELLER_PLANS[plan as SellerPlan] || null;
    case "AGENT":
      return AGENT_PLANS[plan as AgentPlan] || null;
    case "PROFESSIONAL":
      return PROFESSIONAL_PLANS[plan as ProfessionalPlan] || null;
    default:
      return null;
  }
}

/**
 * Get price for a plan based on billing cycle
 */
export function getPlanPrice(
  category: SubscriptionCategory,
  plan: BuyerPlan | SellerPlan | AgentPlan | ProfessionalPlan,
  billingCycle: BillingCycle
): number {
  const config = getPlanConfig(category, plan);
  if (!config) return 0;
  return billingCycle === "YEARLY" ? config.yearlyPrice : config.monthlyPrice;
}

/**
 * Get all plans for a category
 */
export function getPlansForCategory(category: SubscriptionCategory): BasePlanConfig[] {
  switch (category) {
    case "BUYER":
      return Object.values(BUYER_PLANS);
    case "SELLER":
      return Object.values(SELLER_PLANS);
    case "AGENT":
      return Object.values(AGENT_PLANS);
    case "PROFESSIONAL":
      return Object.values(PROFESSIONAL_PLANS);
    default:
      return [];
  }
}

/**
 * Get transaction fee rate for a seller plan
 */
export function getSellerTransactionFeeRate(plan: SellerPlan | null): number {
  if (!plan) return SELLER_PLANS.FREE.transactionFeeRate;
  return SELLER_PLANS[plan]?.transactionFeeRate ?? SELLER_PLANS.FREE.transactionFeeRate;
}

/**
 * Get service commission rate for a professional plan
 */
export function getProfessionalCommissionRate(plan: ProfessionalPlan | null): number {
  if (!plan) return PROFESSIONAL_PLANS.BASIC.serviceCommissionRate;
  return PROFESSIONAL_PLANS[plan]?.serviceCommissionRate ?? PROFESSIONAL_PLANS.BASIC.serviceCommissionRate;
}

/**
 * Get listing limit for a seller plan
 */
export function getSellerListingLimit(plan: SellerPlan | null): number {
  if (!plan) return SELLER_PLANS.FREE.listingLimit;
  return SELLER_PLANS[plan]?.listingLimit ?? SELLER_PLANS.FREE.listingLimit;
}

/**
 * Get client limit for an agent plan
 */
export function getAgentClientLimit(plan: AgentPlan | null): number {
  if (!plan) return AGENT_PLANS.BASIC.clientLimit;
  return AGENT_PLANS[plan]?.clientLimit ?? AGENT_PLANS.BASIC.clientLimit;
}

/**
 * Get lead limit for a professional plan
 */
export function getProfessionalLeadLimit(plan: ProfessionalPlan | null): number {
  if (!plan) return PROFESSIONAL_PLANS.BASIC.leadLimit;
  return PROFESSIONAL_PLANS[plan]?.leadLimit ?? PROFESSIONAL_PLANS.BASIC.leadLimit;
}

/**
 * Check if a plan has a specific feature
 */
export function planHasFeature(
  category: SubscriptionCategory,
  plan: BuyerPlan | SellerPlan | AgentPlan | ProfessionalPlan,
  feature: string
): boolean {
  const config = getPlanConfig(category, plan);
  if (!config) return false;
  return config.features[feature] === true;
}

/**
 * Calculate subscription end date based on billing cycle
 */
export function calculateEndDate(startDate: Date, billingCycle: BillingCycle): Date {
  const endDate = new Date(startDate);
  if (billingCycle === "YEARLY") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }
  return endDate;
}

/**
 * Check if a subscription is expired
 */
export function isSubscriptionExpired(endDate: Date): boolean {
  return new Date() > endDate;
}

/**
 * Get days until subscription expires
 */
export function getDaysUntilExpiry(endDate: Date): number {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Format price for display
 */
export function formatSubscriptionPrice(priceGhs: number): string {
  if (priceGhs === 0) return "Free";
  return `GHS ${priceGhs.toLocaleString()}`;
}

/**
 * Get the default free plan for a category
 */
export function getDefaultFreePlan(category: SubscriptionCategory): string | null {
  switch (category) {
    case "BUYER":
      return "FREE";
    case "SELLER":
      return "FREE";
    case "AGENT":
      return null; // Agents must subscribe
    case "PROFESSIONAL":
      return null; // Professionals must subscribe
    default:
      return null;
  }
}

/**
 * Check if a category requires paid subscription
 */
export function requiresPaidSubscription(category: SubscriptionCategory): boolean {
  return category === "AGENT" || category === "PROFESSIONAL";
}

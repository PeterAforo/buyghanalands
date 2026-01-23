/**
 * Permissions & RBAC Library
 * 
 * Centralized permission checks based on user roles and subscription tiers.
 * Enforces limits on listings, clients, leads, and feature access.
 */

import { prisma } from "./db";
import {
  getSellerListingLimit,
  getAgentClientLimit,
  getProfessionalLeadLimit,
  planHasFeature,
  requiresPaidSubscription,
  SELLER_PLANS,
} from "./subscriptions";

// ============================================================================
// Type Definitions
// ============================================================================

export interface SubscriptionInfo {
  category: string;
  plan: string | null;
  status: string;
  endDate: Date;
  features: Record<string, any> | null;
}

export interface UserPermissions {
  userId: string;
  roles: string[];
  subscriptions: SubscriptionInfo[];
  canCreateListing: boolean;
  canManageClients: boolean;
  canOfferServices: boolean;
  listingLimit: number;
  currentListings: number;
  clientLimit: number;
  currentClients: number;
  leadLimit: number;
  currentLeadsThisMonth: number;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  suggestedPlan?: string;
}

// ============================================================================
// Subscription Queries
// ============================================================================

/**
 * Get user's active subscription for a specific category
 */
export async function getActiveSubscription(
  userId: string,
  category: "BUYER" | "SELLER" | "AGENT" | "PROFESSIONAL"
): Promise<SubscriptionInfo | null> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      category,
      status: "ACTIVE",
      endDate: { gte: new Date() },
    },
    select: {
      category: true,
      buyerPlan: true,
      sellerPlan: true,
      agentPlan: true,
      professionalPlan: true,
      status: true,
      endDate: true,
      features: true,
    },
  });

  if (!subscription) return null;

  // Determine the plan based on category
  let plan: string | null = null;
  switch (category) {
    case "BUYER":
      plan = subscription.buyerPlan;
      break;
    case "SELLER":
      plan = subscription.sellerPlan;
      break;
    case "AGENT":
      plan = subscription.agentPlan;
      break;
    case "PROFESSIONAL":
      plan = subscription.professionalPlan;
      break;
  }

  return {
    category: subscription.category,
    plan,
    status: subscription.status,
    endDate: subscription.endDate,
    features: subscription.features as Record<string, any> | null,
  };
}

/**
 * Get all active subscriptions for a user
 */
export async function getAllActiveSubscriptions(userId: string): Promise<SubscriptionInfo[]> {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId,
      status: "ACTIVE",
      endDate: { gte: new Date() },
    },
    select: {
      category: true,
      buyerPlan: true,
      sellerPlan: true,
      agentPlan: true,
      professionalPlan: true,
      status: true,
      endDate: true,
      features: true,
    },
  });

  return subscriptions.map((sub) => {
    let plan: string | null = null;
    switch (sub.category) {
      case "BUYER":
        plan = sub.buyerPlan;
        break;
      case "SELLER":
        plan = sub.sellerPlan;
        break;
      case "AGENT":
        plan = sub.agentPlan;
        break;
      case "PROFESSIONAL":
        plan = sub.professionalPlan;
        break;
    }
    return {
      category: sub.category,
      plan,
      status: sub.status,
      endDate: sub.endDate,
      features: sub.features as Record<string, any> | null,
    };
  });
}

// ============================================================================
// Listing Permissions (Sellers & Agents)
// ============================================================================

/**
 * Check if user can create a new listing
 */
export async function canCreateListing(userId: string): Promise<PermissionCheckResult> {
  // Get user's roles
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });

  if (!user) {
    return { allowed: false, reason: "User not found" };
  }

  const isSeller = user.roles.includes("SELLER");
  const isAgent = user.roles.includes("AGENT");
  const isAdmin = user.roles.includes("ADMIN");

  // Admins can always create
  if (isAdmin) {
    return { allowed: true };
  }

  // Check seller subscription and limits
  if (isSeller || !isAgent) {
    const sellerSub = await getActiveSubscription(userId, "SELLER");
    const sellerPlan = sellerSub?.plan ?? "FREE";
    const limit = getSellerListingLimit(sellerPlan as any);

    // Count current active listings
    const currentCount = await prisma.listing.count({
      where: {
        sellerId: userId,
        status: { notIn: ["SOLD", "ARCHIVED"] },
      },
    });

    if (limit !== -1 && currentCount >= limit) {
      return {
        allowed: false,
        reason: `You've reached your listing limit (${limit}). Upgrade your plan for more listings.`,
        upgradeRequired: true,
        suggestedPlan: getNextSellerPlan(sellerPlan),
      };
    }

    return { allowed: true };
  }

  // Check agent subscription and limits
  if (isAgent) {
    const agentSub = await getActiveSubscription(userId, "AGENT");
    
    if (!agentSub) {
      return {
        allowed: false,
        reason: "Agents must have an active subscription to manage listings.",
        upgradeRequired: true,
        suggestedPlan: "BASIC",
      };
    }

    // Agents have listing limits too
    const agentProfile = await prisma.agentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (agentProfile) {
      const managedListings = await prisma.agentListing.count({
        where: { agentId: agentProfile.id },
      });

      const limit = agentSub.features?.listingLimit ?? 15;
      if (limit !== -1 && managedListings >= limit) {
        return {
          allowed: false,
          reason: `You've reached your managed listing limit (${limit}). Upgrade your plan.`,
          upgradeRequired: true,
          suggestedPlan: getNextAgentPlan(agentSub.plan),
        };
      }
    }

    return { allowed: true };
  }

  return { allowed: false, reason: "You need seller or agent role to create listings." };
}

/**
 * Check if a listing has expired (for free tier)
 */
export async function isListingExpired(listingId: string): Promise<boolean> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      sellerId: true,
      createdAt: true,
      status: true,
    },
  });

  if (!listing || listing.status === "SOLD" || listing.status === "ARCHIVED") {
    return false;
  }

  // Get seller's subscription
  const sellerSub = await getActiveSubscription(listing.sellerId, "SELLER");
  const sellerPlan = sellerSub?.plan ?? "FREE";

  // Check expiry days for the plan
  const expiryDays = SELLER_PLANS[sellerPlan as keyof typeof SELLER_PLANS]?.listingExpiryDays ?? 30;

  if (expiryDays === 0) {
    return false; // No expiry
  }

  const expiryDate = new Date(listing.createdAt);
  expiryDate.setDate(expiryDate.getDate() + expiryDays);

  return new Date() > expiryDate;
}

// ============================================================================
// Client Permissions (Agents)
// ============================================================================

/**
 * Check if agent can add a new client
 */
export async function canAddClient(agentUserId: string): Promise<PermissionCheckResult> {
  const agentSub = await getActiveSubscription(agentUserId, "AGENT");

  if (!agentSub) {
    return {
      allowed: false,
      reason: "You need an active agent subscription to manage clients.",
      upgradeRequired: true,
      suggestedPlan: "BASIC",
    };
  }

  const agentProfile = await prisma.agentProfile.findUnique({
    where: { userId: agentUserId },
    select: { id: true },
  });

  if (!agentProfile) {
    return { allowed: false, reason: "Agent profile not found." };
  }

  const currentClients = await prisma.agentClient.count({
    where: {
      agentId: agentProfile.id,
      status: { in: ["PENDING", "ACTIVE"] },
    },
  });

  const limit = getAgentClientLimit(agentSub.plan as any);

  if (limit !== -1 && currentClients >= limit) {
    return {
      allowed: false,
      reason: `You've reached your client limit (${limit}). Upgrade your plan.`,
      upgradeRequired: true,
      suggestedPlan: getNextAgentPlan(agentSub.plan),
    };
  }

  return { allowed: true };
}

// ============================================================================
// Professional Service Permissions
// ============================================================================

/**
 * Check if professional can accept a new lead/request
 */
export async function canAcceptLead(professionalUserId: string): Promise<PermissionCheckResult> {
  const profSub = await getActiveSubscription(professionalUserId, "PROFESSIONAL");

  if (!profSub) {
    return {
      allowed: false,
      reason: "You need an active professional subscription to accept service requests.",
      upgradeRequired: true,
      suggestedPlan: "BASIC",
    };
  }

  const limit = getProfessionalLeadLimit(profSub.plan as any);

  if (limit === -1) {
    return { allowed: true }; // Unlimited
  }

  // Count leads accepted this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const professionalProfile = await prisma.professionalProfile.findUnique({
    where: { userId: professionalUserId },
    select: { id: true },
  });

  if (!professionalProfile) {
    return { allowed: false, reason: "Professional profile not found." };
  }

  const leadsThisMonth = await prisma.serviceRequest.count({
    where: {
      professionalId: professionalProfile.id,
      status: { in: ["ACCEPTED", "IN_PROGRESS", "DELIVERED", "COMPLETED"] },
      updatedAt: { gte: startOfMonth },
    },
  });

  if (leadsThisMonth >= limit) {
    return {
      allowed: false,
      reason: `You've reached your monthly lead limit (${limit}). Upgrade for more leads.`,
      upgradeRequired: true,
      suggestedPlan: getNextProfessionalPlan(profSub.plan),
    };
  }

  return { allowed: true };
}

/**
 * Check if user can create a professional profile
 */
export async function canCreateProfessionalProfile(userId: string): Promise<PermissionCheckResult> {
  // Check if already has a profile
  const existing = await prisma.professionalProfile.findUnique({
    where: { userId },
  });

  if (existing) {
    return { allowed: false, reason: "You already have a professional profile." };
  }

  // Professionals must subscribe before creating profile
  const profSub = await getActiveSubscription(userId, "PROFESSIONAL");

  if (!profSub) {
    return {
      allowed: false,
      reason: "You need to subscribe to a professional plan before creating your profile.",
      upgradeRequired: true,
      suggestedPlan: "BASIC",
    };
  }

  return { allowed: true };
}

// ============================================================================
// Feature Access Checks
// ============================================================================

/**
 * Check if user has access to a specific feature
 */
export async function hasFeatureAccess(
  userId: string,
  category: "BUYER" | "SELLER" | "AGENT" | "PROFESSIONAL",
  feature: string
): Promise<boolean> {
  const subscription = await getActiveSubscription(userId, category);

  if (!subscription) {
    // Check if category has a free tier
    if (category === "BUYER" || category === "SELLER") {
      // Use free plan features
      return planHasFeature(category, "FREE" as any, feature);
    }
    return false;
  }

  // Check subscription features
  if (subscription.features && feature in subscription.features) {
    return subscription.features[feature] === true;
  }

  // Fall back to plan config
  return planHasFeature(category, subscription.plan as any, feature);
}

/**
 * Check if user has analytics access
 */
export async function hasAnalyticsAccess(userId: string): Promise<boolean> {
  // Check seller subscription
  const sellerSub = await getActiveSubscription(userId, "SELLER");
  if (sellerSub && ["PRO", "ENTERPRISE"].includes(sellerSub.plan ?? "")) {
    return true;
  }

  // Check agent subscription
  const agentSub = await getActiveSubscription(userId, "AGENT");
  if (agentSub && ["PRO", "ELITE"].includes(agentSub.plan ?? "")) {
    return true;
  }

  // Check professional subscription
  const profSub = await getActiveSubscription(userId, "PROFESSIONAL");
  if (profSub && ["PRO", "ELITE"].includes(profSub.plan ?? "")) {
    return true;
  }

  return false;
}

/**
 * Check if user has API access
 */
export async function hasApiAccess(userId: string): Promise<boolean> {
  const sellerSub = await getActiveSubscription(userId, "SELLER");
  if (sellerSub?.plan === "ENTERPRISE") {
    return true;
  }

  const agentSub = await getActiveSubscription(userId, "AGENT");
  if (agentSub?.plan === "ELITE") {
    return true;
  }

  const profSub = await getActiveSubscription(userId, "PROFESSIONAL");
  if (profSub?.plan === "ELITE") {
    return true;
  }

  return false;
}

// ============================================================================
// Onboarding Checks
// ============================================================================

/**
 * Check if user needs to complete subscription before accessing features
 */
export async function needsSubscription(
  userId: string,
  category: "AGENT" | "PROFESSIONAL"
): Promise<boolean> {
  if (!requiresPaidSubscription(category)) {
    return false;
  }

  const subscription = await getActiveSubscription(userId, category);
  return !subscription;
}

/**
 * Get onboarding redirect URL based on user state
 */
export async function getOnboardingRedirect(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });

  if (!user) return "/auth/login";

  // Check if agent needs subscription
  if (user.roles.includes("AGENT")) {
    const agentSub = await getActiveSubscription(userId, "AGENT");
    if (!agentSub) {
      return "/onboarding/agent/subscription";
    }

    // Check if agent profile exists
    const agentProfile = await prisma.agentProfile.findUnique({
      where: { userId },
    });
    if (!agentProfile) {
      return "/onboarding/agent/profile";
    }
  }

  // Check if professional needs subscription
  if (user.roles.includes("PROFESSIONAL")) {
    const profSub = await getActiveSubscription(userId, "PROFESSIONAL");
    if (!profSub) {
      return "/onboarding/professional/subscription";
    }

    // Check if professional profile exists
    const profProfile = await prisma.professionalProfile.findUnique({
      where: { userId },
    });
    if (!profProfile) {
      return "/onboarding/professional/profile";
    }
  }

  return null; // No onboarding needed
}

// ============================================================================
// Helper Functions
// ============================================================================

function getNextSellerPlan(currentPlan: string | null): string {
  const order = ["FREE", "STARTER", "PRO", "ENTERPRISE"];
  const currentIndex = order.indexOf(currentPlan ?? "FREE");
  return order[Math.min(currentIndex + 1, order.length - 1)];
}

function getNextAgentPlan(currentPlan: string | null): string {
  const order = ["BASIC", "PRO", "ELITE"];
  const currentIndex = order.indexOf(currentPlan ?? "BASIC");
  return order[Math.min(currentIndex + 1, order.length - 1)];
}

function getNextProfessionalPlan(currentPlan: string | null): string {
  const order = ["BASIC", "PRO", "ELITE"];
  const currentIndex = order.indexOf(currentPlan ?? "BASIC");
  return order[Math.min(currentIndex + 1, order.length - 1)];
}

// ============================================================================
// Full Permission Check
// ============================================================================

/**
 * Get comprehensive permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const subscriptions = await getAllActiveSubscriptions(userId);

  // Get seller info
  const sellerSub = subscriptions.find((s) => s.category === "SELLER");
  const listingLimit = getSellerListingLimit(sellerSub?.plan as any);
  const currentListings = await prisma.listing.count({
    where: {
      sellerId: userId,
      status: { notIn: ["SOLD", "ARCHIVED"] },
    },
  });

  // Get agent info
  const agentSub = subscriptions.find((s) => s.category === "AGENT");
  const clientLimit = getAgentClientLimit(agentSub?.plan as any);
  let currentClients = 0;
  const agentProfile = await prisma.agentProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (agentProfile) {
    currentClients = await prisma.agentClient.count({
      where: {
        agentId: agentProfile.id,
        status: { in: ["PENDING", "ACTIVE"] },
      },
    });
  }

  // Get professional info
  const profSub = subscriptions.find((s) => s.category === "PROFESSIONAL");
  const leadLimit = getProfessionalLeadLimit(profSub?.plan as any);
  let currentLeadsThisMonth = 0;
  const profProfile = await prisma.professionalProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (profProfile) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    currentLeadsThisMonth = await prisma.serviceRequest.count({
      where: {
        professionalId: profProfile.id,
        status: { in: ["ACCEPTED", "IN_PROGRESS", "DELIVERED", "COMPLETED"] },
        updatedAt: { gte: startOfMonth },
      },
    });
  }

  return {
    userId,
    roles: user.roles,
    subscriptions,
    canCreateListing: listingLimit === -1 || currentListings < listingLimit,
    canManageClients: !!agentSub && (clientLimit === -1 || currentClients < clientLimit),
    canOfferServices: !!profSub,
    listingLimit,
    currentListings,
    clientLimit,
    currentClients,
    leadLimit,
    currentLeadsThisMonth,
  };
}

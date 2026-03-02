// Constants for BuyGhanaLands

export const GHANA_REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Eastern",
  "Central",
  "Northern",
  "Volta",
  "Upper East",
  "Upper West",
  "Bono",
  "Bono East",
  "Ahafo",
  "Western North",
  "Oti",
  "North East",
  "Savannah",
] as const;

export type GhanaRegion = (typeof GHANA_REGIONS)[number];

export const LAND_TYPES = [
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "INDUSTRIAL", label: "Industrial" },
  { value: "AGRICULTURAL", label: "Agricultural" },
  { value: "MIXED", label: "Mixed Use" },
] as const;

export const TENURE_TYPES = [
  { value: "FREEHOLD", label: "Freehold" },
  { value: "LEASEHOLD", label: "Leasehold" },
  { value: "CUSTOMARY", label: "Customary" },
] as const;

export const VERIFICATION_LEVELS = [
  { value: "LEVEL_0_UNVERIFIED", label: "Unverified", color: "gray" },
  { value: "LEVEL_1_DOCS_UPLOADED", label: "Documents Uploaded", color: "yellow" },
  { value: "LEVEL_2_PLATFORM_REVIEWED", label: "Platform Verified", color: "blue" },
  { value: "LEVEL_3_OFFICIAL_VERIFIED", label: "Officially Verified", color: "green" },
] as const;

export const LISTING_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "PUBLISHED", label: "Published" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "SOLD", label: "Sold" },
] as const;

export const TRANSACTION_STATUSES = [
  { value: "CREATED", label: "Created" },
  { value: "ESCROW_REQUESTED", label: "Escrow Requested" },
  { value: "FUNDED", label: "Funded" },
  { value: "VERIFICATION_PERIOD", label: "Verification Period" },
  { value: "DISPUTED", label: "Disputed" },
  { value: "READY_TO_RELEASE", label: "Ready to Release" },
  { value: "RELEASED", label: "Released" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "PARTIAL_SETTLED", label: "Partially Settled" },
  { value: "CLOSED", label: "Closed" },
] as const;

export const OFFER_STATUSES = [
  { value: "SENT", label: "Sent" },
  { value: "COUNTERED", label: "Countered" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "EXPIRED", label: "Expired" },
  { value: "WITHDRAWN", label: "Withdrawn" },
] as const;

export const KYC_TIERS = [
  { value: "TIER_0_OTP", label: "Basic (OTP Verified)", limit: 10000 },
  { value: "TIER_1_ID_UPLOAD", label: "Standard (ID Uploaded)", limit: 100000 },
  { value: "TIER_2_GHANA_CARD", label: "Premium (Ghana Card Verified)", limit: null },
] as const;

// Platform fees
export const PLATFORM_FEE_BPS = 250; // 2.5%
export const MIN_LISTING_FEE_GHS = 50;
export const MAX_LISTING_FEE_GHS = 500;

// Limits
export const MAX_IMAGES_PER_LISTING = 10;
export const MAX_DOCUMENTS_PER_LISTING = 20;
export const MAX_FILE_SIZE_MB = 10;
export const MAX_OFFERS_PER_LISTING = 50;

// Timeouts
export const OTP_EXPIRY_MINUTES = 10;
export const OFFER_EXPIRY_DAYS = 7;
export const VERIFICATION_PERIOD_DAYS = 14;
export const REFRESH_TOKEN_EXPIRY_DAYS = 30;
export const ACCESS_TOKEN_EXPIRY_MINUTES = 15;

// Deep link scheme
export const DEEP_LINK_SCHEME = "buyghanalands";
export const WEB_URL = "https://buyghanalands.com";

// API endpoints
export const API_VERSION = "v1";

// Notification channels (Android)
export const NOTIFICATION_CHANNELS = {
  messages: { id: "messages", name: "Messages", importance: "high" },
  offers: { id: "offers", name: "Offers", importance: "high" },
  transactions: { id: "transactions", name: "Transactions", importance: "high" },
  listings: { id: "listings", name: "Listings", importance: "default" },
  verification: { id: "verification", name: "Verification", importance: "default" },
  alerts: { id: "alerts", name: "Alerts", importance: "default" },
  disputes: { id: "disputes", name: "Disputes", importance: "high" },
  default: { id: "default", name: "General", importance: "default" },
} as const;

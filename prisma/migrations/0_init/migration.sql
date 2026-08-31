-- PostGIS extension (required for GeoBoundary model)
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BUYER', 'SELLER', 'AGENT', 'PROFESSIONAL', 'ADMIN', 'SUPPORT', 'COMPLIANCE', 'FINANCE', 'MODERATOR');

-- CreateEnum
CREATE TYPE "KycTier" AS ENUM ('TIER_0_OTP', 'TIER_1_ID_UPLOAD', 'TIER_2_GHANA_CARD');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PUBLISHED', 'SUSPENDED', 'REJECTED', 'ARCHIVED', 'SOLD');

-- CreateEnum
CREATE TYPE "ListingTenureType" AS ENUM ('FREEHOLD', 'LEASEHOLD', 'CUSTOMARY');

-- CreateEnum
CREATE TYPE "ListingLandType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL', 'MIXED');

-- CreateEnum
CREATE TYPE "VerificationLevel" AS ENUM ('LEVEL_0_UNVERIFIED', 'LEVEL_1_DOCS_UPLOADED', 'LEVEL_2_PLATFORM_REVIEWED', 'LEVEL_3_OFFICIAL_VERIFIED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('PHOTO', 'VIDEO');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('INDENTURE_DEED', 'SITE_PLAN', 'CADASTRAL_PLAN', 'LAND_TITLE_CERTIFICATE', 'LETTERS_OF_ADMINISTRATION', 'FAMILY_RESOLUTION', 'OTHER', 'SELLER_ID', 'VERIFICATION_CERTIFICATE', 'TRANSACTION_AGREEMENT');

-- CreateEnum
CREATE TYPE "AccessPolicy" AS ENUM ('PRIVATE', 'LOGGED_IN_REDACTED', 'TRANSACTION_PARTIES', 'PUBLIC');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('SENT', 'COUNTERED', 'ACCEPTED', 'EXPIRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('CREATED', 'ESCROW_REQUESTED', 'FUNDED', 'VERIFICATION_PERIOD', 'DISPUTED', 'READY_TO_RELEASE', 'RELEASED', 'REFUNDED', 'PARTIAL_SETTLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'MEDIATION', 'RESOLVED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ResolutionOutcome" AS ENUM ('RELEASE', 'REFUND', 'PARTIAL', 'TERMINATE');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('THETELLER', 'FLUTTERWAVE', 'PAYSTACK', 'HUBTEL', 'BANK_TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PermitQueryStatus" AS ENUM ('OPEN', 'RESPONDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('LISTING_FEE', 'TRANSACTION_FUNDING', 'PAYOUT', 'REFUND', 'ADJUSTMENT', 'PROFESSIONAL_PAYOUT', 'SERVICE_FEE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'REVERSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FraudCaseStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'ACTION_TAKEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('LISTING', 'USER', 'MESSAGE', 'TRANSACTION');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'ACTIONED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('USER', 'LISTING', 'LISTING_VERSION', 'OFFER', 'TRANSACTION', 'PAYMENT', 'VERIFICATION_REQUEST', 'DISPUTE', 'FRAUD_CASE', 'REPORT', 'DOCUMENT', 'MESSAGE', 'KYC_REQUEST', 'PERMIT_APPLICATION', 'SUPPORT_TICKET');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('USER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ProfessionalType" AS ENUM ('SURVEYOR', 'LAWYER', 'ARCHITECT', 'ENGINEER', 'PLANNER', 'VALUER', 'OTHER');

-- CreateEnum
CREATE TYPE "ProfessionalLicenseStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('OPEN', 'OFFERED', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "PermitApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'QUERY_RAISED', 'RESUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PermitDocType" AS ENUM ('SITE_PLAN', 'ARCHITECTURAL_DRAWINGS', 'STRUCTURAL_DRAWINGS', 'FIRE_REPORT', 'EPA_REPORT', 'OWNERSHIP_DOCS', 'ID_DOCS', 'RECEIPT', 'OTHER', 'PERMIT_CERTIFICATE');

-- CreateEnum
CREATE TYPE "UssdSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'REVOKED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ApiScope" AS ENUM ('LISTINGS_READ', 'LISTINGS_WRITE', 'TRANSACTIONS_READ', 'TRANSACTIONS_WRITE', 'PROFESSIONALS_READ', 'PROFESSIONALS_WRITE', 'PERMITS_READ', 'PERMITS_WRITE', 'KYC_READ', 'KYC_WRITE', 'WEBHOOKS_MANAGE', 'ADMIN_READ');

-- CreateEnum
CREATE TYPE "WebhookEventType" AS ENUM ('LISTING_CREATED', 'LISTING_PUBLISHED', 'LISTING_SUSPENDED', 'OFFER_CREATED', 'OFFER_ACCEPTED', 'TRANSACTION_CREATED', 'TRANSACTION_STATUS_CHANGED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'VERIFICATION_STATUS_CHANGED', 'KYC_STATUS_CHANGED', 'PERMIT_STATUS_CHANGED', 'SERVICE_REQUEST_STATUS_CHANGED');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'RETRYING', 'DEAD');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('INITIATED', 'PENDING', 'PASSED', 'FAILED', 'RETRY', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "KycReason" AS ENUM ('SELLER_VERIFICATION', 'HIGH_VALUE_TRANSACTION', 'PROFESSIONAL_REGISTRATION', 'MANUAL_REQUEST');

-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('IOS', 'ANDROID', 'WEB');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('BASIC', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'CANCELLED', 'EXPIRED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionCategory" AS ENUM ('BUYER', 'SELLER', 'AGENT', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "BuyerPlan" AS ENUM ('FREE', 'PREMIUM', 'VIP');

-- CreateEnum
CREATE TYPE "SellerPlan" AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "AgentPlan" AS ENUM ('BASIC', 'PRO', 'ELITE');

-- CreateEnum
CREATE TYPE "ProfessionalPlan" AS ENUM ('BASIC', 'PRO', 'ELITE');

-- CreateEnum
CREATE TYPE "ServiceChargeType" AS ENUM ('LAND_SALE_SELLER_FEE', 'LAND_SALE_BUYER_FEE', 'PROFESSIONAL_SERVICE_FEE', 'AGENT_COMMISSION', 'LISTING_FEE', 'VERIFICATION_FEE');

-- CreateEnum
CREATE TYPE "ServiceChargeStatus" AS ENUM ('PENDING', 'COLLECTED', 'WAIVED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "FeaturedListingStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AlertFrequency" AS ENUM ('INSTANT', 'DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "SellerBadgeLevel" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "SellerBadgeStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "VirtualTourType" AS ENUM ('PHOTO_360', 'VIDEO', 'DRONE', 'WALKTHROUGH');

-- CreateEnum
CREATE TYPE "InsuranceCoverageLevel" AS ENUM ('BASIC', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "EscrowInsuranceStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'CLAIM_FILED', 'CLAIM_APPROVED', 'CLAIM_REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InsuranceClaimStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "InsuranceClaimReason" AS ENUM ('FRAUD', 'TITLE_ISSUE', 'DOCUMENT_FORGERY', 'SELLER_DEFAULT', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentVerificationStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'REVIEW_NEEDED');

-- CreateEnum
CREATE TYPE "AgentClientStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "WorkflowType" AS ENUM ('LAND_ACQUISITION', 'PRE_CONSTRUCTION', 'BUILDING_PERMIT', 'CONSTRUCTION', 'COMPLETION');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StageStatus" AS ENUM ('LOCKED', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "LandOwnershipType" AS ENUM ('GOVERNMENT', 'VESTED', 'CUSTOMARY_STOOL', 'FAMILY_PRIVATE');

-- CreateEnum
CREATE TYPE "VerificationFindingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'ISSUES_FOUND', 'DISPUTED');

-- CreateEnum
CREATE TYPE "NegotiationStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'AGREED', 'FAILED');

-- CreateEnum
CREATE TYPE "PossessionStatus" AS ENUM ('NOT_TAKEN', 'MARKING_TERRITORY', 'MONITORING', 'SECURED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "BuildingTypeEnum" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'MIXED_USE', 'INSTITUTIONAL');

-- CreateEnum
CREATE TYPE "DesignPhase" AS ENUM ('BRIEFING', 'CONCEPTUAL', 'DETAILED', 'FINAL_REVIEW', 'APPROVED');

-- CreateEnum
CREATE TYPE "PermitWorkflowStatus" AS ENUM ('DRAFT', 'DOCUMENTS_GATHERING', 'READY_TO_SUBMIT', 'SUBMITTED', 'PRELIMINARY_REVIEW', 'SITE_INSPECTION_SCHEDULED', 'SITE_INSPECTION_COMPLETE', 'TECHNICAL_REVIEW', 'COMMITTEE_REVIEW', 'APPROVED', 'APPROVED_WITH_CONDITIONS', 'DEFERRED', 'REJECTED', 'APPEAL_IN_PROGRESS', 'PERMIT_ISSUED');

-- CreateEnum
CREATE TYPE "InspectionOutcome" AS ENUM ('PASSED', 'PASSED_WITH_CONDITIONS', 'FAILED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "ConstructionPhase" AS ENUM ('PRE_CONSTRUCTION', 'FOUNDATION', 'SUBSTRUCTURE', 'SUPERSTRUCTURE', 'ROOFING', 'FINISHING', 'EXTERNAL_WORKS', 'FINAL_INSPECTION', 'COMPLETION');

-- CreateEnum
CREATE TYPE "ConstructionInspectionType" AS ENUM ('SITE_CLEARANCE', 'FOUNDATION', 'GROUND_FLOOR_SLAB', 'FIRST_FLOOR_SLAB', 'ROOF_LEVEL', 'FINAL_COMPLETION', 'FIRE_SAFETY', 'ELECTRICAL', 'PLUMBING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT NOT NULL,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "passwordHash" TEXT,
    "fullName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "roles" "UserRole"[],
    "kycTier" "KycTier" NOT NULL DEFAULT 'TIER_0_OTP',
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "language" TEXT NOT NULL DEFAULT 'en',
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "payoutAccountNumber" TEXT,
    "payoutAccountIssuer" TEXT,
    "payoutAccountBank" TEXT,
    "payoutAccountType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OTPVerification" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OTPVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "landType" "ListingLandType" NOT NULL,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "constituency" TEXT,
    "district" TEXT NOT NULL,
    "town" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "landType" "ListingLandType" NOT NULL,
    "categoryId" TEXT,
    "tenureType" "ListingTenureType" NOT NULL,
    "leaseDurationYears" INTEGER,
    "sizeAcres" DECIMAL(12,4) NOT NULL,
    "totalPlots" INTEGER NOT NULL DEFAULT 1,
    "availablePlots" INTEGER NOT NULL DEFAULT 1,
    "soldPlots" INTEGER NOT NULL DEFAULT 0,
    "pricePerPlotGhs" BIGINT,
    "priceGhs" BIGINT NOT NULL,
    "negotiable" BOOLEAN NOT NULL DEFAULT true,
    "verificationLevel" "VerificationLevel" NOT NULL DEFAULT 'LEVEL_0_UNVERIFIED',
    "currentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingVersion" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'UNDER_REVIEW',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "town" TEXT NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "landType" "ListingLandType" NOT NULL,
    "tenureType" "ListingTenureType" NOT NULL,
    "leaseDurationYears" INTEGER,
    "sizeAcres" DECIMAL(12,4) NOT NULL,
    "sizePlots" INTEGER,
    "priceGhs" BIGINT NOT NULL,
    "negotiable" BOOLEAN NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingMedia" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER,
    "height" INTEGER,
    "durationSec" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoBoundary" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "geojson" JSONB,
    "geometry" geometry(Polygon, 4326),
    "areaSqm" DECIMAL(18,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeoBoundary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "listingId" TEXT,
    "transactionId" TEXT,
    "disputeId" TEXT,
    "type" "DocumentType" NOT NULL,
    "accessPolicy" "AccessPolicy" NOT NULL DEFAULT 'PRIVATE',
    "url" TEXT NOT NULL,
    "redactedUrl" TEXT,
    "sha256" VARCHAR(64),
    "fileSizeBytes" BIGINT,
    "mimeType" TEXT,
    "virusScanStatus" TEXT,
    "exifStripped" BOOLEAN NOT NULL DEFAULT true,
    "watermarked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentAccessLog" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "parentOfferId" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'SENT',
    "amountGhs" BIGINT NOT NULL,
    "message" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "offerId" TEXT,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'CREATED',
    "agreedPriceGhs" BIGINT NOT NULL,
    "platformFeeBps" INTEGER NOT NULL DEFAULT 150,
    "verificationDaysMin" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowMilestone" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amountGhs" BIGINT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "requiresBuyerApproval" BOOLEAN NOT NULL DEFAULT true,
    "requiresSellerApproval" BOOLEAN NOT NULL DEFAULT true,
    "requiresAdminApproval" BOOLEAN NOT NULL DEFAULT false,
    "buyerApprovedAt" TIMESTAMP(3),
    "sellerApprovedAt" TIMESTAMP(3),
    "adminApprovedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscrowMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT,
    "listingId" TEXT,
    "provider" "PaymentProvider" NOT NULL,
    "type" "PaymentType" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'INITIATED',
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "amount" BIGINT NOT NULL,
    "fees" BIGINT NOT NULL DEFAULT 0,
    "netAmount" BIGINT NOT NULL DEFAULT 0,
    "providerRef" TEXT,
    "receiptRef" TEXT,
    "payerUserId" TEXT,
    "payeeUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "levelRequested" "VerificationLevel" NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "assignedToId" TEXT,
    "checklist" JSONB,
    "outcomeNotes" TEXT,
    "referenceNo" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "raisedById" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "summary" TEXT NOT NULL,
    "details" TEXT,
    "sellerRespondedAt" TIMESTAMP(3),
    "platformReviewedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolutionOutcome" "ResolutionOutcome",
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "listingId" TEXT,
    "transactionId" TEXT,
    "body" TEXT NOT NULL,
    "attachmentDocId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "listingId" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudCase" (
    "id" TEXT NOT NULL,
    "openedById" TEXT NOT NULL,
    "listingId" TEXT,
    "userId" TEXT,
    "status" "FraudCaseStatus" NOT NULL DEFAULT 'OPEN',
    "summary" TEXT NOT NULL,
    "evidence" JSONB,
    "actionTaken" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FraudCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL DEFAULT 'USER',
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "diff" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "professionalType" "ProfessionalType" NOT NULL,
    "bio" TEXT,
    "companyName" TEXT,
    "yearsExperience" INTEGER,
    "serviceRegions" TEXT[],
    "baseLocation" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "licenseNumber" TEXT,
    "licenseBody" TEXT,
    "licenseStatus" "ProfessionalLicenseStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "portfolioUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalService" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priceGhs" BIGINT,
    "priceModel" TEXT NOT NULL DEFAULT 'FIXED',
    "turnaroundDays" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "listingId" TEXT,
    "transactionId" TEXT,
    "professionalId" TEXT,
    "serviceId" TEXT,
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "details" TEXT,
    "preferredDate" TIMESTAMP(3),
    "locationNote" TEXT,
    "offerPriceGhs" BIGINT,
    "acceptedPriceGhs" BIGINT,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'REQUESTED',
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "bookingId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistrictAssembly" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "officeAddress" TEXT,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistrictAssembly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermitApplication" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "listingId" TEXT,
    "transactionId" TEXT,
    "assemblyId" TEXT NOT NULL,
    "status" "PermitApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "projectTitle" TEXT NOT NULL,
    "projectDescription" TEXT,
    "landLocationNote" TEXT,
    "plotSizeNote" TEXT,
    "estimatedCostGhs" BIGINT,
    "buildingType" TEXT,
    "storeys" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermitApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermitDocument" (
    "id" TEXT NOT NULL,
    "permitApplicationId" TEXT NOT NULL,
    "type" "PermitDocType" NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PermitDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermitStatusHistory" (
    "id" TEXT NOT NULL,
    "permitApplicationId" TEXT NOT NULL,
    "fromStatus" "PermitApplicationStatus",
    "toStatus" "PermitApplicationStatus" NOT NULL,
    "note" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PermitStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermitQuery" (
    "id" TEXT NOT NULL,
    "permitApplicationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "response" TEXT,
    "status" "PermitQueryStatus" NOT NULL DEFAULT 'OPEN',
    "raisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermitQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermitFeePayment" (
    "id" TEXT NOT NULL,
    "permitApplicationId" TEXT NOT NULL,
    "feeType" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "status" "PaymentStatus" NOT NULL DEFAULT 'INITIATED',
    "providerRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermitFeePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UssdSession" (
    "id" TEXT NOT NULL,
    "msisdn" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" "UssdSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "menuPath" TEXT[],
    "data" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "UssdSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiClient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contactEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "scopes" "ApiScope"[],
    "status" "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "rateLimit" INTEGER NOT NULL DEFAULT 1000,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiUsageLog" (
    "id" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEndpoint" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" "WebhookEventType"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "eventType" "WebhookEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "nextRetryAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ghanaCardNumber" TEXT NOT NULL,
    "selfieUrl" TEXT,
    "reason" "KycReason" NOT NULL DEFAULT 'MANUAL_REQUEST',
    "status" "KycStatus" NOT NULL DEFAULT 'INITIATED',
    "providerRef" TEXT,
    "providerPayload" JSONB,
    "reviewNotes" TEXT,
    "reviewedById" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" "DevicePlatform" NOT NULL,
    "deviceName" TEXT,
    "appVersion" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newOffers" BOOLEAN NOT NULL DEFAULT true,
    "offerUpdates" BOOLEAN NOT NULL DEFAULT true,
    "messages" BOOLEAN NOT NULL DEFAULT true,
    "transactionAlerts" BOOLEAN NOT NULL DEFAULT true,
    "listingUpdates" BOOLEAN NOT NULL DEFAULT true,
    "verificationAlerts" BOOLEAN NOT NULL DEFAULT true,
    "savedSearchAlerts" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "SubscriptionCategory" NOT NULL,
    "buyerPlan" "BuyerPlan",
    "sellerPlan" "SellerPlan",
    "agentPlan" "AgentPlan",
    "professionalPlan" "ProfessionalPlan",
    "plan" "SubscriptionPlan",
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "priceGhs" INTEGER NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "features" JSONB,
    "transactionFeeRate" DOUBLE PRECISION,
    "serviceCommissionRate" DOUBLE PRECISION,
    "listingLimit" INTEGER,
    "clientLimit" INTEGER,
    "leadLimit" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amountGhs" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "providerRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCharge" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT,
    "bookingId" TEXT,
    "chargeType" "ServiceChargeType" NOT NULL,
    "status" "ServiceChargeStatus" NOT NULL DEFAULT 'PENDING',
    "baseAmountGhs" BIGINT NOT NULL,
    "feeRate" DOUBLE PRECISION NOT NULL,
    "feeAmountGhs" BIGINT NOT NULL,
    "payerId" TEXT NOT NULL,
    "payeeId" TEXT,
    "subscriptionId" TEXT,
    "collectedAt" TIMESTAMP(3),
    "paymentRef" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturedListing" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "priceGhs" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" "FeaturedListingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeaturedListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifySms" BOOLEAN NOT NULL DEFAULT false,
    "frequency" "AlertFrequency" NOT NULL DEFAULT 'INSTANT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" "SellerBadgeLevel" NOT NULL DEFAULT 'BRONZE',
    "status" "SellerBadgeStatus" NOT NULL DEFAULT 'ACTIVE',
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "issuedById" TEXT,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VirtualTour" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "type" "VirtualTourType" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "title" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VirtualTour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowInsurance" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "coverageLevel" "InsuranceCoverageLevel" NOT NULL,
    "premiumGhs" INTEGER NOT NULL,
    "coverageAmountGhs" INTEGER NOT NULL,
    "status" "EscrowInsuranceStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "features" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscrowInsurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceClaim" (
    "id" TEXT NOT NULL,
    "insuranceId" TEXT NOT NULL,
    "claimantId" TEXT NOT NULL,
    "reason" "InsuranceClaimReason" NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceUrls" TEXT[],
    "claimAmountGhs" INTEGER NOT NULL,
    "approvedAmountGhs" INTEGER,
    "status" "InsuranceClaimStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVerification" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "status" "DocumentVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "checks" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agencyName" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "bio" TEXT,
    "serviceRegions" TEXT[],
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "specializations" TEXT[],
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentClient" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "AgentClientStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentListing" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentCommission" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amountGhs" INTEGER NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppSession" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'MAIN_MENU',
    "data" JSONB,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "alertEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyWorkflow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT,
    "propertyTitle" TEXT,
    "propertyAddress" TEXT,
    "region" TEXT,
    "district" TEXT,
    "town" TEXT,
    "plotNumber" TEXT,
    "landSizeAcres" DECIMAL(10,4),
    "currentModule" "WorkflowType" NOT NULL DEFAULT 'LAND_ACQUISITION',
    "overallStatus" "WorkflowStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "overallProgress" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandAcquisitionWorkflow" (
    "id" TEXT NOT NULL,
    "propertyWorkflowId" TEXT NOT NULL,
    "currentStage" INTEGER NOT NULL DEFAULT 1,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "stage1Status" "StageStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "stage1Progress" INTEGER NOT NULL DEFAULT 0,
    "lawyerEngaged" BOOLEAN NOT NULL DEFAULT false,
    "lawyerProfessionalId" TEXT,
    "surveyorEngaged" BOOLEAN NOT NULL DEFAULT false,
    "surveyorProfessionalId" TEXT,
    "propertyInspections" JSONB,
    "ownershipVerified" BOOLEAN NOT NULL DEFAULT false,
    "ownershipVerificationStatus" "VerificationFindingStatus" NOT NULL DEFAULT 'PENDING',
    "landOwnershipType" "LandOwnershipType",
    "isForeignBuyer" BOOLEAN NOT NULL DEFAULT false,
    "stage2Status" "StageStatus" NOT NULL DEFAULT 'LOCKED',
    "stage2Progress" INTEGER NOT NULL DEFAULT 0,
    "independentSurveyCommissioned" BOOLEAN NOT NULL DEFAULT false,
    "independentSurveyStatus" TEXT,
    "surveyReportReceived" BOOLEAN NOT NULL DEFAULT false,
    "verifiedSitePlanObtained" BOOLEAN NOT NULL DEFAULT false,
    "landsCommissionSearchDone" BOOLEAN NOT NULL DEFAULT false,
    "searchFindings" JSONB,
    "neighborConsultationDone" BOOLEAN NOT NULL DEFAULT false,
    "neighborConsultationLog" JSONB,
    "stage3Status" "StageStatus" NOT NULL DEFAULT 'LOCKED',
    "stage3Progress" INTEGER NOT NULL DEFAULT 0,
    "negotiationStatus" "NegotiationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "initialOfferGhs" DECIMAL(15,2),
    "agreedPriceGhs" DECIMAL(15,2),
    "paymentTerms" TEXT,
    "purchaseAgreementDrafted" BOOLEAN NOT NULL DEFAULT false,
    "agreementCopiesCount" INTEGER NOT NULL DEFAULT 0,
    "witnessesArranged" BOOLEAN NOT NULL DEFAULT false,
    "witnesses" JSONB,
    "documentsSignedEndorsed" BOOLEAN NOT NULL DEFAULT false,
    "stage4Status" "StageStatus" NOT NULL DEFAULT 'LOCKED',
    "stage4Progress" INTEGER NOT NULL DEFAULT 0,
    "paymentMethod" TEXT,
    "totalPaidGhs" DECIMAL(15,2),
    "payments" JSONB,
    "stampDutyPaid" BOOLEAN NOT NULL DEFAULT false,
    "stampDutyAmountGhs" DECIMAL(15,2),
    "vatPaid" BOOLEAN NOT NULL DEFAULT false,
    "vatAmountGhs" DECIMAL(15,2),
    "registrationFeePaid" BOOLEAN NOT NULL DEFAULT false,
    "registrationFeeGhs" DECIMAL(15,2),
    "allDocumentsGathered" BOOLEAN NOT NULL DEFAULT false,
    "stage5Status" "StageStatus" NOT NULL DEFAULT 'LOCKED',
    "stage5Progress" INTEGER NOT NULL DEFAULT 0,
    "submittedToLandsCommission" BOOLEAN NOT NULL DEFAULT false,
    "landsCommissionSubmissionDate" TIMESTAMP(3),
    "landsCommissionRefNumber" TEXT,
    "registrationStatus" TEXT DEFAULT 'NOT_SUBMITTED',
    "valuationBoardStatus" TEXT,
    "irsTaxClearanceStatus" TEXT,
    "deedsRegistryStatus" TEXT,
    "landTitleReceived" BOOLEAN NOT NULL DEFAULT false,
    "landTitleNumber" TEXT,
    "cadastralPlanReceived" BOOLEAN NOT NULL DEFAULT false,
    "stage6Status" "StageStatus" NOT NULL DEFAULT 'LOCKED',
    "stage6Progress" INTEGER NOT NULL DEFAULT 0,
    "possessionStatus" "PossessionStatus" NOT NULL DEFAULT 'NOT_TAKEN',
    "territoryMarked" BOOLEAN NOT NULL DEFAULT false,
    "markingActions" JSONB,
    "monitoringSchedule" TEXT,
    "securityHired" BOOLEAN NOT NULL DEFAULT false,
    "securityCompanyDetails" TEXT,
    "lastSiteVisit" TIMESTAMP(3),
    "nextScheduledVisit" TIMESTAMP(3),
    "incidents" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandAcquisitionWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreConstructionWorkflow" (
    "id" TEXT NOT NULL,
    "propertyWorkflowId" TEXT NOT NULL,
    "currentStage" INTEGER NOT NULL DEFAULT 7,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "buildingAreaSqm" DECIMAL(10,2),
    "numberOfStoreys" INTEGER,
    "buildingType" "BuildingTypeEnum",
    "estimatedBudgetGhs" DECIMAL(15,2),
    "stage7Status" "StageStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "stage7Progress" INTEGER NOT NULL DEFAULT 0,
    "architectRequired" BOOLEAN NOT NULL DEFAULT false,
    "architectEngaged" BOOLEAN NOT NULL DEFAULT false,
    "architectProfessionalId" TEXT,
    "structuralEngineerRequired" BOOLEAN NOT NULL DEFAULT false,
    "structuralEngineerEngaged" BOOLEAN NOT NULL DEFAULT false,
    "structuralEngineerProfessionalId" TEXT,
    "meEngineerRequired" BOOLEAN NOT NULL DEFAULT false,
    "meEngineerEngaged" BOOLEAN NOT NULL DEFAULT false,
    "meEngineerProfessionalId" TEXT,
    "quantitySurveyorEngaged" BOOLEAN NOT NULL DEFAULT false,
    "quantitySurveyorProfessionalId" TEXT,
    "landSurveyorEngaged" BOOLEAN NOT NULL DEFAULT false,
    "landSurveyorProfessionalId" TEXT,
    "professionalFeesEstimate" DECIMAL(15,2),
    "stage8Status" "StageStatus" NOT NULL DEFAULT 'LOCKED',
    "stage8Progress" INTEGER NOT NULL DEFAULT 0,
    "designPhase" "DesignPhase" NOT NULL DEFAULT 'BRIEFING',
    "projectBriefSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "projectBrief" JSONB,
    "siteAnalysisComplete" BOOLEAN NOT NULL DEFAULT false,
    "siteAnalysis" JSONB,
    "preliminaryDesignApproved" BOOLEAN NOT NULL DEFAULT false,
    "designRevisionCount" INTEGER NOT NULL DEFAULT 0,
    "architecturalDrawingsComplete" BOOLEAN NOT NULL DEFAULT false,
    "architecturalDrawings" JSONB,
    "structuralDrawingsComplete" BOOLEAN NOT NULL DEFAULT false,
    "structuralDrawings" JSONB,
    "meDrawingsComplete" BOOLEAN NOT NULL DEFAULT false,
    "meDrawings" JSONB,
    "soilTestRequired" BOOLEAN NOT NULL DEFAULT false,
    "soilTestComplete" BOOLEAN NOT NULL DEFAULT false,
    "soilTestResults" JSONB,
    "fireSafetyReportRequired" BOOLEAN NOT NULL DEFAULT false,
    "fireSafetyReportComplete" BOOLEAN NOT NULL DEFAULT false,
    "environmentalPermitRequired" BOOLEAN NOT NULL DEFAULT false,
    "environmentalPermitObtained" BOOLEAN NOT NULL DEFAULT false,
    "structuralAnalysisRequired" BOOLEAN NOT NULL DEFAULT false,
    "structuralAnalysisComplete" BOOLEAN NOT NULL DEFAULT false,
    "seismicDesignCompliant" BOOLEAN NOT NULL DEFAULT false,
    "qsEstimateReceived" BOOLEAN NOT NULL DEFAULT false,
    "estimatedConstructionCostGhs" DECIMAL(15,2),
    "costBreakdown" JSONB,
    "allDrawingsComplete" BOOLEAN NOT NULL DEFAULT false,
    "professionalSignaturesVerified" BOOLEAN NOT NULL DEFAULT false,
    "clientFinalApproval" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreConstructionWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildingPermitWorkflow" (
    "id" TEXT NOT NULL,
    "propertyWorkflowId" TEXT NOT NULL,
    "currentStage" INTEGER NOT NULL DEFAULT 9,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "stage9Status" "StageStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "stage9Progress" INTEGER NOT NULL DEFAULT 0,
    "districtAssemblyId" TEXT,
    "applicationFormType" TEXT,
    "applicationFormComplete" BOOLEAN NOT NULL DEFAULT false,
    "applicationFormData" JSONB,
    "landOwnershipDocsUploaded" BOOLEAN NOT NULL DEFAULT false,
    "architecturalDrawingsUploaded" BOOLEAN NOT NULL DEFAULT false,
    "structuralDrawingsUploaded" BOOLEAN NOT NULL DEFAULT false,
    "proofOfIdentityUploaded" BOOLEAN NOT NULL DEFAULT false,
    "surveyorCertificateUploaded" BOOLEAN NOT NULL DEFAULT false,
    "firePermitRequired" BOOLEAN NOT NULL DEFAULT false,
    "firePermitUploaded" BOOLEAN NOT NULL DEFAULT false,
    "soilTestReportRequired" BOOLEAN NOT NULL DEFAULT false,
    "soilTestReportUploaded" BOOLEAN NOT NULL DEFAULT false,
    "fireSafetyReportRequired" BOOLEAN NOT NULL DEFAULT false,
    "fireSafetyReportUploaded" BOOLEAN NOT NULL DEFAULT false,
    "environmentalPermitRequired" BOOLEAN NOT NULL DEFAULT false,
    "environmentalPermitUploaded" BOOLEAN NOT NULL DEFAULT false,
    "structuralAnalysisRequired" BOOLEAN NOT NULL DEFAULT false,
    "structuralAnalysisUploaded" BOOLEAN NOT NULL DEFAULT false,
    "eiaRequired" BOOLEAN NOT NULL DEFAULT false,
    "eiaUploaded" BOOLEAN NOT NULL DEFAULT false,
    "documentCompletenessScore" INTEGER NOT NULL DEFAULT 0,
    "stage10Status" "StageStatus" NOT NULL DEFAULT 'LOCKED',
    "stage10Progress" INTEGER NOT NULL DEFAULT 0,
    "preSubmissionValidationPassed" BOOLEAN NOT NULL DEFAULT false,
    "submissionMethod" TEXT,
    "submissionDate" TIMESTAMP(3),
    "applicationRefNumber" TEXT,
    "submissionReceiptUploaded" BOOLEAN NOT NULL DEFAULT false,
    "processingFeeCalculated" BOOLEAN NOT NULL DEFAULT false,
    "processingFeeGhs" DECIMAL(15,2),
    "processingFeePaid" BOOLEAN NOT NULL DEFAULT false,
    "processingFeePaymentDate" TIMESTAMP(3),
    "processingFeeReceiptUploaded" BOOLEAN NOT NULL DEFAULT false,
    "stage11Status" "StageStatus" NOT NULL DEFAULT 'LOCKED',
    "stage11Progress" INTEGER NOT NULL DEFAULT 0,
    "applicationStatus" "PermitWorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "preliminaryReviewStatus" TEXT,
    "reviewerAssigned" TEXT,
    "completenessCheckPassed" BOOLEAN,
    "technicalCompliancePassed" BOOLEAN,
    "zoningCompliancePassed" BOOLEAN,
    "queriesRaised" JSONB,
    "siteInspectionScheduled" BOOLEAN NOT NULL DEFAULT false,
    "siteInspectionDate" TIMESTAMP(3),
    "siteInspectionComplete" BOOLEAN NOT NULL DEFAULT false,
    "siteInspectionOutcome" "InspectionOutcome",
    "siteInspectionFindings" JSONB,
    "siteInspectionConditions" JSONB,
    "technicalReviewStatus" TEXT,
    "departmentReviews" JSONB,
    "technicalCommitteeRecommendation" TEXT,
    "committeeReviewScheduled" BOOLEAN NOT NULL DEFAULT false,
    "committeeMeetingDate" TIMESTAMP(3),
    "committeeDecision" TEXT,
    "decisionDate" TIMESTAMP(3),
    "decisionCommunicatedDate" TIMESTAMP(3),
    "deferralReasons" JSONB,
    "rejectionReasons" JSONB,
    "appealSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "appealStatus" TEXT,
    "stage12Status" "StageStatus" NOT NULL DEFAULT 'LOCKED',
    "stage12Progress" INTEGER NOT NULL DEFAULT 0,
    "permitFeeCalculated" BOOLEAN NOT NULL DEFAULT false,
    "permitFeeGhs" DECIMAL(15,2),
    "permitFeeDeadline" TIMESTAMP(3),
    "permitFeePaid" BOOLEAN NOT NULL DEFAULT false,
    "permitFeePaymentDate" TIMESTAMP(3),
    "permitFeeReceiptUploaded" BOOLEAN NOT NULL DEFAULT false,
    "permitCertificateIssued" BOOLEAN NOT NULL DEFAULT false,
    "permitNumber" TEXT,
    "permitIssueDate" TIMESTAMP(3),
    "permitExpiryDate" TIMESTAMP(3),
    "permitConditions" JSONB,
    "permitCertificateUploaded" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildingPermitWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionWorkflow" (
    "id" TEXT NOT NULL,
    "propertyWorkflowId" TEXT NOT NULL,
    "currentStage" INTEGER NOT NULL DEFAULT 13,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentPhase" "ConstructionPhase" NOT NULL DEFAULT 'PRE_CONSTRUCTION',
    "stage13Status" "StageStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "stage13Progress" INTEGER NOT NULL DEFAULT 0,
    "siteHoardingPermitRequired" BOOLEAN NOT NULL DEFAULT false,
    "siteHoardingPermitObtained" BOOLEAN NOT NULL DEFAULT false,
    "siteHoardingPermitExpiry" TIMESTAMP(3),
    "temporaryFacilitiesPermitObtained" BOOLEAN NOT NULL DEFAULT false,
    "districtInspectorNotified" BOOLEAN NOT NULL DEFAULT false,
    "notificationDate" TIMESTAMP(3),
    "inspectorAssigned" TEXT,
    "inspectorContact" TEXT,
    "contractorCompanyName" TEXT,
    "contractorLicenseNumber" TEXT,
    "contractorInsuranceDetails" TEXT,
    "contractValue" DECIMAL(15,2),
    "contractDurationMonths" INTEGER,
    "contractDocumentUploaded" BOOLEAN NOT NULL DEFAULT false,
    "healthSafetyPlanUploaded" BOOLEAN NOT NULL DEFAULT false,
    "foundationStartDate" TIMESTAMP(3),
    "foundationCompleteDate" TIMESTAMP(3),
    "foundationInspectionPassed" BOOLEAN,
    "superstructureStartDate" TIMESTAMP(3),
    "superstructureCompleteDate" TIMESTAMP(3),
    "roofingStartDate" TIMESTAMP(3),
    "roofingCompleteDate" TIMESTAMP(3),
    "roofingInspectionPassed" BOOLEAN,
    "finishingStartDate" TIMESTAMP(3),
    "finishingCompleteDate" TIMESTAMP(3),
    "finalInspectionScheduled" BOOLEAN NOT NULL DEFAULT false,
    "finalInspectionDate" TIMESTAMP(3),
    "finalInspectionPassed" BOOLEAN,
    "occupancyCertificateIssued" BOOLEAN NOT NULL DEFAULT false,
    "occupancyCertificateNumber" TEXT,
    "occupancyCertificateDate" TIMESTAMP(3),
    "constructionStartDate" TIMESTAMP(3),
    "constructionEndDate" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionInspection" (
    "id" TEXT NOT NULL,
    "constructionWorkflowId" TEXT NOT NULL,
    "inspectionType" "ConstructionInspectionType" NOT NULL,
    "scheduledDate" TIMESTAMP(3),
    "actualDate" TIMESTAMP(3),
    "inspectorName" TEXT,
    "inspectorContact" TEXT,
    "outcome" "InspectionOutcome",
    "findings" JSONB,
    "conditions" JSONB,
    "photosUploaded" BOOLEAN NOT NULL DEFAULT false,
    "reportUploaded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowDocument" (
    "id" TEXT NOT NULL,
    "propertyWorkflowId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "documentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "previousVersionId" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowNote" (
    "id" TEXT NOT NULL,
    "propertyWorkflowId" TEXT NOT NULL,
    "module" "WorkflowType" NOT NULL,
    "stage" INTEGER NOT NULL,
    "taskId" TEXT,
    "content" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowAlert" (
    "id" TEXT NOT NULL,
    "propertyWorkflowId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "module" "WorkflowType",
    "stage" INTEGER,
    "taskId" TEXT,
    "triggerDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "notificationSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowCostTracker" (
    "id" TEXT NOT NULL,
    "propertyWorkflowId" TEXT NOT NULL,
    "landPurchasePrice" DECIMAL(15,2),
    "legalFees" DECIMAL(15,2),
    "surveyorFees" DECIMAL(15,2),
    "stampDuty" DECIMAL(15,2),
    "vat" DECIMAL(15,2),
    "registrationFees" DECIMAL(15,2),
    "architectFees" DECIMAL(15,2),
    "engineerFees" DECIMAL(15,2),
    "quantitySurveyorFees" DECIMAL(15,2),
    "soilTestFees" DECIMAL(15,2),
    "otherProfessionalFees" DECIMAL(15,2),
    "processingFees" DECIMAL(15,2),
    "permitFees" DECIMAL(15,2),
    "firePermitFees" DECIMAL(15,2),
    "environmentalPermitFees" DECIMAL(15,2),
    "constructionBudget" DECIMAL(15,2),
    "constructionActual" DECIMAL(15,2),
    "totalBudget" DECIMAL(15,2),
    "totalActual" DECIMAL(15,2),
    "costItems" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowCostTracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTaskTemplate" (
    "id" TEXT NOT NULL,
    "module" "WorkflowType" NOT NULL,
    "stage" INTEGER NOT NULL,
    "taskOrder" INTEGER NOT NULL,
    "taskKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "helpText" TEXT,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "isConditional" BOOLEAN NOT NULL DEFAULT false,
    "conditionLogic" JSONB,
    "estimatedDurationDays" INTEGER,
    "warningMessage" TEXT,
    "documentTypes" JSONB,
    "linkedProfessionalType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowTaskTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BookingToDocument" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BookingToDocument_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "OTPVerification_phone_key" ON "OTPVerification"("phone");

-- CreateIndex
CREATE INDEX "OTPVerification_phone_idx" ON "OTPVerification"("phone");

-- CreateIndex
CREATE INDEX "OTPVerification_expiresAt_idx" ON "OTPVerification"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_email_idx" ON "EmailVerificationToken"("email");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_token_idx" ON "EmailVerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "LandCategory_name_key" ON "LandCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LandCategory_slug_key" ON "LandCategory"("slug");

-- CreateIndex
CREATE INDEX "LandCategory_landType_isActive_idx" ON "LandCategory"("landType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_currentVersionId_key" ON "Listing"("currentVersionId");

-- CreateIndex
CREATE INDEX "Listing_sellerId_status_idx" ON "Listing"("sellerId", "status");

-- CreateIndex
CREATE INDEX "Listing_status_publishedAt_idx" ON "Listing"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Listing_region_district_idx" ON "Listing"("region", "district");

-- CreateIndex
CREATE INDEX "ListingVersion_listingId_createdAt_idx" ON "ListingVersion"("listingId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ListingVersion_listingId_versionNumber_key" ON "ListingVersion"("listingId", "versionNumber");

-- CreateIndex
CREATE INDEX "ListingMedia_listingId_sortOrder_idx" ON "ListingMedia"("listingId", "sortOrder");

-- CreateIndex
CREATE INDEX "GeoBoundary_listingId_idx" ON "GeoBoundary"("listingId");

-- CreateIndex
CREATE INDEX "Document_listingId_type_idx" ON "Document"("listingId", "type");

-- CreateIndex
CREATE INDEX "Document_transactionId_type_idx" ON "Document"("transactionId", "type");

-- CreateIndex
CREATE INDEX "DocumentAccessLog_documentId_createdAt_idx" ON "DocumentAccessLog"("documentId", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentAccessLog_userId_createdAt_idx" ON "DocumentAccessLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Offer_listingId_status_idx" ON "Offer"("listingId", "status");

-- CreateIndex
CREATE INDEX "Offer_buyerId_createdAt_idx" ON "Offer"("buyerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_offerId_key" ON "Transaction"("offerId");

-- CreateIndex
CREATE INDEX "Transaction_buyerId_status_idx" ON "Transaction"("buyerId", "status");

-- CreateIndex
CREATE INDEX "Transaction_sellerId_status_idx" ON "Transaction"("sellerId", "status");

-- CreateIndex
CREATE INDEX "Transaction_listingId_status_idx" ON "Transaction"("listingId", "status");

-- CreateIndex
CREATE INDEX "EscrowMilestone_transactionId_sortOrder_idx" ON "EscrowMilestone"("transactionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerRef_key" ON "Payment"("providerRef");

-- CreateIndex
CREATE INDEX "Payment_transactionId_type_status_idx" ON "Payment"("transactionId", "type", "status");

-- CreateIndex
CREATE INDEX "Payment_listingId_type_status_idx" ON "Payment"("listingId", "type", "status");

-- CreateIndex
CREATE INDEX "VerificationRequest_listingId_status_idx" ON "VerificationRequest"("listingId", "status");

-- CreateIndex
CREATE INDEX "VerificationRequest_userId_createdAt_idx" ON "VerificationRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Dispute_transactionId_status_idx" ON "Dispute"("transactionId", "status");

-- CreateIndex
CREATE INDEX "Message_senderId_createdAt_idx" ON "Message"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_receiverId_createdAt_idx" ON "Message"("receiverId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_transactionId_createdAt_idx" ON "Message"("transactionId", "createdAt");

-- CreateIndex
CREATE INDEX "Report_targetType_targetId_idx" ON "Report"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "FraudCase_status_createdAt_idx" ON "FraudCase"("status", "createdAt");

-- CreateIndex
CREATE INDEX "FraudCase_listingId_idx" ON "FraudCase"("listingId");

-- CreateIndex
CREATE INDEX "FraudCase_userId_idx" ON "FraudCase"("userId");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_createdAt_idx" ON "SupportTicket"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_transactionId_createdAt_idx" ON "SupportTicket"("transactionId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalProfile_userId_key" ON "ProfessionalProfile"("userId");

-- CreateIndex
CREATE INDEX "ProfessionalProfile_professionalType_isActive_idx" ON "ProfessionalProfile"("professionalType", "isActive");

-- CreateIndex
CREATE INDEX "ProfessionalService_professionalId_isPublished_idx" ON "ProfessionalService"("professionalId", "isPublished");

-- CreateIndex
CREATE INDEX "ServiceRequest_requesterId_createdAt_idx" ON "ServiceRequest"("requesterId", "createdAt");

-- CreateIndex
CREATE INDEX "ServiceRequest_professionalId_status_idx" ON "ServiceRequest"("professionalId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_serviceRequestId_key" ON "Booking"("serviceRequestId");

-- CreateIndex
CREATE INDEX "Review_professionalId_createdAt_idx" ON "Review"("professionalId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_reviewerId_createdAt_idx" ON "Review"("reviewerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DistrictAssembly_name_key" ON "DistrictAssembly"("name");

-- CreateIndex
CREATE INDEX "DistrictAssembly_region_district_idx" ON "DistrictAssembly"("region", "district");

-- CreateIndex
CREATE INDEX "PermitApplication_applicantId_createdAt_idx" ON "PermitApplication"("applicantId", "createdAt");

-- CreateIndex
CREATE INDEX "PermitApplication_assemblyId_status_idx" ON "PermitApplication"("assemblyId", "status");

-- CreateIndex
CREATE INDEX "PermitDocument_permitApplicationId_type_idx" ON "PermitDocument"("permitApplicationId", "type");

-- CreateIndex
CREATE INDEX "PermitStatusHistory_permitApplicationId_createdAt_idx" ON "PermitStatusHistory"("permitApplicationId", "createdAt");

-- CreateIndex
CREATE INDEX "PermitQuery_permitApplicationId_raisedAt_idx" ON "PermitQuery"("permitApplicationId", "raisedAt");

-- CreateIndex
CREATE INDEX "PermitFeePayment_permitApplicationId_feeType_idx" ON "PermitFeePayment"("permitApplicationId", "feeType");

-- CreateIndex
CREATE UNIQUE INDEX "UssdSession_sessionId_key" ON "UssdSession"("sessionId");

-- CreateIndex
CREATE INDEX "UssdSession_msisdn_startedAt_idx" ON "UssdSession"("msisdn", "startedAt");

-- CreateIndex
CREATE INDEX "UssdSession_status_updatedAt_idx" ON "UssdSession"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_clientId_status_idx" ON "ApiKey"("clientId", "status");

-- CreateIndex
CREATE INDEX "ApiUsageLog_keyId_createdAt_idx" ON "ApiUsageLog"("keyId", "createdAt");

-- CreateIndex
CREATE INDEX "ApiUsageLog_path_createdAt_idx" ON "ApiUsageLog"("path", "createdAt");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_clientId_isActive_idx" ON "WebhookEndpoint"("clientId", "isActive");

-- CreateIndex
CREATE INDEX "WebhookDelivery_endpointId_createdAt_idx" ON "WebhookDelivery"("endpointId", "createdAt");

-- CreateIndex
CREATE INDEX "WebhookDelivery_status_nextRetryAt_idx" ON "WebhookDelivery"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "KycRequest_userId_createdAt_idx" ON "KycRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "KycRequest_status_idx" ON "KycRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_token_key" ON "DeviceToken"("token");

-- CreateIndex
CREATE INDEX "DeviceToken_userId_isActive_idx" ON "DeviceToken"("userId", "isActive");

-- CreateIndex
CREATE INDEX "DeviceToken_token_idx" ON "DeviceToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "PushNotification_userId_read_idx" ON "PushNotification"("userId", "read");

-- CreateIndex
CREATE INDEX "PushNotification_createdAt_idx" ON "PushNotification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreferences_userId_key" ON "NotificationPreferences"("userId");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

-- CreateIndex
CREATE INDEX "Subscription_userId_category_idx" ON "Subscription"("userId", "category");

-- CreateIndex
CREATE INDEX "Subscription_endDate_idx" ON "Subscription"("endDate");

-- CreateIndex
CREATE INDEX "Subscription_status_endDate_idx" ON "Subscription"("status", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_category_status_key" ON "Subscription"("userId", "category", "status");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_subscriptionId_createdAt_idx" ON "SubscriptionPayment"("subscriptionId", "createdAt");

-- CreateIndex
CREATE INDEX "ServiceCharge_transactionId_chargeType_idx" ON "ServiceCharge"("transactionId", "chargeType");

-- CreateIndex
CREATE INDEX "ServiceCharge_bookingId_chargeType_idx" ON "ServiceCharge"("bookingId", "chargeType");

-- CreateIndex
CREATE INDEX "ServiceCharge_payerId_createdAt_idx" ON "ServiceCharge"("payerId", "createdAt");

-- CreateIndex
CREATE INDEX "ServiceCharge_status_createdAt_idx" ON "ServiceCharge"("status", "createdAt");

-- CreateIndex
CREATE INDEX "FeaturedListing_listingId_status_idx" ON "FeaturedListing"("listingId", "status");

-- CreateIndex
CREATE INDEX "FeaturedListing_status_endDate_idx" ON "FeaturedListing"("status", "endDate");

-- CreateIndex
CREATE INDEX "ListingAlert_userId_isActive_idx" ON "ListingAlert"("userId", "isActive");

-- CreateIndex
CREATE INDEX "ListingAlert_frequency_isActive_idx" ON "ListingAlert"("frequency", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SellerBadge_userId_key" ON "SellerBadge"("userId");

-- CreateIndex
CREATE INDEX "SellerBadge_status_expiresAt_idx" ON "SellerBadge"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "VirtualTour_listingId_sortOrder_idx" ON "VirtualTour"("listingId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "EscrowInsurance_transactionId_key" ON "EscrowInsurance"("transactionId");

-- CreateIndex
CREATE INDEX "EscrowInsurance_buyerId_status_idx" ON "EscrowInsurance"("buyerId", "status");

-- CreateIndex
CREATE INDEX "EscrowInsurance_status_expiresAt_idx" ON "EscrowInsurance"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "InsuranceClaim_insuranceId_status_idx" ON "InsuranceClaim"("insuranceId", "status");

-- CreateIndex
CREATE INDEX "InsuranceClaim_claimantId_createdAt_idx" ON "InsuranceClaim"("claimantId", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentVerification_documentId_createdAt_idx" ON "DocumentVerification"("documentId", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentVerification_requestedById_createdAt_idx" ON "DocumentVerification"("requestedById", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgentProfile_userId_key" ON "AgentProfile"("userId");

-- CreateIndex
CREATE INDEX "AgentProfile_isActive_isVerified_idx" ON "AgentProfile"("isActive", "isVerified");

-- CreateIndex
CREATE INDEX "AgentClient_agentId_status_idx" ON "AgentClient"("agentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AgentClient_agentId_clientId_key" ON "AgentClient"("agentId", "clientId");

-- CreateIndex
CREATE INDEX "AgentListing_agentId_idx" ON "AgentListing"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentListing_agentId_listingId_key" ON "AgentListing"("agentId", "listingId");

-- CreateIndex
CREATE INDEX "AgentCommission_agentId_status_idx" ON "AgentCommission"("agentId", "status");

-- CreateIndex
CREATE INDEX "AgentCommission_transactionId_idx" ON "AgentCommission"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppSession_phone_key" ON "WhatsAppSession"("phone");

-- CreateIndex
CREATE INDEX "WhatsAppSession_phone_idx" ON "WhatsAppSession"("phone");

-- CreateIndex
CREATE INDEX "WhatsAppSession_lastMessageAt_idx" ON "WhatsAppSession"("lastMessageAt");

-- CreateIndex
CREATE INDEX "Favorite_userId_createdAt_idx" ON "Favorite"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_listingId_key" ON "Favorite"("userId", "listingId");

-- CreateIndex
CREATE INDEX "SavedSearch_userId_createdAt_idx" ON "SavedSearch"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SavedSearch_alertEnabled_idx" ON "SavedSearch"("alertEnabled");

-- CreateIndex
CREATE INDEX "SystemSetting_category_idx" ON "SystemSetting"("category");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_category_key_key" ON "SystemSetting"("category", "key");

-- CreateIndex
CREATE INDEX "PropertyWorkflow_userId_idx" ON "PropertyWorkflow"("userId");

-- CreateIndex
CREATE INDEX "PropertyWorkflow_listingId_idx" ON "PropertyWorkflow"("listingId");

-- CreateIndex
CREATE INDEX "PropertyWorkflow_currentModule_overallStatus_idx" ON "PropertyWorkflow"("currentModule", "overallStatus");

-- CreateIndex
CREATE UNIQUE INDEX "LandAcquisitionWorkflow_propertyWorkflowId_key" ON "LandAcquisitionWorkflow"("propertyWorkflowId");

-- CreateIndex
CREATE INDEX "LandAcquisitionWorkflow_propertyWorkflowId_idx" ON "LandAcquisitionWorkflow"("propertyWorkflowId");

-- CreateIndex
CREATE INDEX "LandAcquisitionWorkflow_currentStage_status_idx" ON "LandAcquisitionWorkflow"("currentStage", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PreConstructionWorkflow_propertyWorkflowId_key" ON "PreConstructionWorkflow"("propertyWorkflowId");

-- CreateIndex
CREATE INDEX "PreConstructionWorkflow_propertyWorkflowId_idx" ON "PreConstructionWorkflow"("propertyWorkflowId");

-- CreateIndex
CREATE INDEX "PreConstructionWorkflow_currentStage_status_idx" ON "PreConstructionWorkflow"("currentStage", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BuildingPermitWorkflow_propertyWorkflowId_key" ON "BuildingPermitWorkflow"("propertyWorkflowId");

-- CreateIndex
CREATE INDEX "BuildingPermitWorkflow_propertyWorkflowId_idx" ON "BuildingPermitWorkflow"("propertyWorkflowId");

-- CreateIndex
CREATE INDEX "BuildingPermitWorkflow_districtAssemblyId_idx" ON "BuildingPermitWorkflow"("districtAssemblyId");

-- CreateIndex
CREATE INDEX "BuildingPermitWorkflow_applicationStatus_idx" ON "BuildingPermitWorkflow"("applicationStatus");

-- CreateIndex
CREATE INDEX "BuildingPermitWorkflow_currentStage_status_idx" ON "BuildingPermitWorkflow"("currentStage", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionWorkflow_propertyWorkflowId_key" ON "ConstructionWorkflow"("propertyWorkflowId");

-- CreateIndex
CREATE INDEX "ConstructionWorkflow_propertyWorkflowId_idx" ON "ConstructionWorkflow"("propertyWorkflowId");

-- CreateIndex
CREATE INDEX "ConstructionWorkflow_currentPhase_status_idx" ON "ConstructionWorkflow"("currentPhase", "status");

-- CreateIndex
CREATE INDEX "ConstructionInspection_constructionWorkflowId_idx" ON "ConstructionInspection"("constructionWorkflowId");

-- CreateIndex
CREATE INDEX "ConstructionInspection_inspectionType_idx" ON "ConstructionInspection"("inspectionType");

-- CreateIndex
CREATE INDEX "WorkflowDocument_propertyWorkflowId_idx" ON "WorkflowDocument"("propertyWorkflowId");

-- CreateIndex
CREATE INDEX "WorkflowDocument_category_idx" ON "WorkflowDocument"("category");

-- CreateIndex
CREATE INDEX "WorkflowDocument_documentType_idx" ON "WorkflowDocument"("documentType");

-- CreateIndex
CREATE INDEX "WorkflowNote_propertyWorkflowId_idx" ON "WorkflowNote"("propertyWorkflowId");

-- CreateIndex
CREATE INDEX "WorkflowNote_module_stage_idx" ON "WorkflowNote"("module", "stage");

-- CreateIndex
CREATE INDEX "WorkflowAlert_propertyWorkflowId_idx" ON "WorkflowAlert"("propertyWorkflowId");

-- CreateIndex
CREATE INDEX "WorkflowAlert_alertType_isRead_idx" ON "WorkflowAlert"("alertType", "isRead");

-- CreateIndex
CREATE INDEX "WorkflowAlert_triggerDate_idx" ON "WorkflowAlert"("triggerDate");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowCostTracker_propertyWorkflowId_key" ON "WorkflowCostTracker"("propertyWorkflowId");

-- CreateIndex
CREATE INDEX "WorkflowCostTracker_propertyWorkflowId_idx" ON "WorkflowCostTracker"("propertyWorkflowId");

-- CreateIndex
CREATE INDEX "WorkflowTaskTemplate_module_stage_idx" ON "WorkflowTaskTemplate"("module", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTaskTemplate_module_stage_taskKey_key" ON "WorkflowTaskTemplate"("module", "stage", "taskKey");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_email_idx" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE INDEX "_BookingToDocument_B_index" ON "_BookingToDocument"("B");

-- AddForeignKey
ALTER TABLE "OTPVerification" ADD CONSTRAINT "OTPVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LandCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "ListingVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingVersion" ADD CONSTRAINT "ListingVersion_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingVersion" ADD CONSTRAINT "ListingVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingMedia" ADD CONSTRAINT "ListingMedia_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeoBoundary" ADD CONSTRAINT "GeoBoundary_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAccessLog" ADD CONSTRAINT "DocumentAccessLog_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAccessLog" ADD CONSTRAINT "DocumentAccessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_parentOfferId_fkey" FOREIGN KEY ("parentOfferId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowMilestone" ADD CONSTRAINT "EscrowMilestone_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payerUserId_fkey" FOREIGN KEY ("payerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payeeUserId_fkey" FOREIGN KEY ("payeeUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_attachmentDocId_fkey" FOREIGN KEY ("attachmentDocId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudCase" ADD CONSTRAINT "FraudCase_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudCase" ADD CONSTRAINT "FraudCase_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudCase" ADD CONSTRAINT "FraudCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalProfile" ADD CONSTRAINT "ProfessionalProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalService" ADD CONSTRAINT "ProfessionalService_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "ProfessionalProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "ProfessionalProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ProfessionalService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "ProfessionalProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "ProfessionalProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermitApplication" ADD CONSTRAINT "PermitApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermitApplication" ADD CONSTRAINT "PermitApplication_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermitApplication" ADD CONSTRAINT "PermitApplication_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermitApplication" ADD CONSTRAINT "PermitApplication_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "DistrictAssembly"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermitDocument" ADD CONSTRAINT "PermitDocument_permitApplicationId_fkey" FOREIGN KEY ("permitApplicationId") REFERENCES "PermitApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermitDocument" ADD CONSTRAINT "PermitDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermitStatusHistory" ADD CONSTRAINT "PermitStatusHistory_permitApplicationId_fkey" FOREIGN KEY ("permitApplicationId") REFERENCES "PermitApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermitStatusHistory" ADD CONSTRAINT "PermitStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermitQuery" ADD CONSTRAINT "PermitQuery_permitApplicationId_fkey" FOREIGN KEY ("permitApplicationId") REFERENCES "PermitApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermitFeePayment" ADD CONSTRAINT "PermitFeePayment_permitApplicationId_fkey" FOREIGN KEY ("permitApplicationId") REFERENCES "PermitApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ApiClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiUsageLog" ADD CONSTRAINT "ApiUsageLog_keyId_fkey" FOREIGN KEY ("keyId") REFERENCES "ApiKey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ApiClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "WebhookEndpoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycRequest" ADD CONSTRAINT "KycRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycRequest" ADD CONSTRAINT "KycRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushNotification" ADD CONSTRAINT "PushNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCharge" ADD CONSTRAINT "ServiceCharge_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCharge" ADD CONSTRAINT "ServiceCharge_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCharge" ADD CONSTRAINT "ServiceCharge_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCharge" ADD CONSTRAINT "ServiceCharge_payeeId_fkey" FOREIGN KEY ("payeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCharge" ADD CONSTRAINT "ServiceCharge_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedListing" ADD CONSTRAINT "FeaturedListing_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedListing" ADD CONSTRAINT "FeaturedListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingAlert" ADD CONSTRAINT "ListingAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerBadge" ADD CONSTRAINT "SellerBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerBadge" ADD CONSTRAINT "SellerBadge_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualTour" ADD CONSTRAINT "VirtualTour_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowInsurance" ADD CONSTRAINT "EscrowInsurance_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowInsurance" ADD CONSTRAINT "EscrowInsurance_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_insuranceId_fkey" FOREIGN KEY ("insuranceId") REFERENCES "EscrowInsurance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVerification" ADD CONSTRAINT "DocumentVerification_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVerification" ADD CONSTRAINT "DocumentVerification_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentProfile" ADD CONSTRAINT "AgentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentClient" ADD CONSTRAINT "AgentClient_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentClient" ADD CONSTRAINT "AgentClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentListing" ADD CONSTRAINT "AgentListing_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentListing" ADD CONSTRAINT "AgentListing_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentCommission" ADD CONSTRAINT "AgentCommission_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentCommission" ADD CONSTRAINT "AgentCommission_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyWorkflow" ADD CONSTRAINT "PropertyWorkflow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyWorkflow" ADD CONSTRAINT "PropertyWorkflow_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandAcquisitionWorkflow" ADD CONSTRAINT "LandAcquisitionWorkflow_propertyWorkflowId_fkey" FOREIGN KEY ("propertyWorkflowId") REFERENCES "PropertyWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreConstructionWorkflow" ADD CONSTRAINT "PreConstructionWorkflow_propertyWorkflowId_fkey" FOREIGN KEY ("propertyWorkflowId") REFERENCES "PropertyWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingPermitWorkflow" ADD CONSTRAINT "BuildingPermitWorkflow_propertyWorkflowId_fkey" FOREIGN KEY ("propertyWorkflowId") REFERENCES "PropertyWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingPermitWorkflow" ADD CONSTRAINT "BuildingPermitWorkflow_districtAssemblyId_fkey" FOREIGN KEY ("districtAssemblyId") REFERENCES "DistrictAssembly"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionWorkflow" ADD CONSTRAINT "ConstructionWorkflow_propertyWorkflowId_fkey" FOREIGN KEY ("propertyWorkflowId") REFERENCES "PropertyWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionInspection" ADD CONSTRAINT "ConstructionInspection_constructionWorkflowId_fkey" FOREIGN KEY ("constructionWorkflowId") REFERENCES "ConstructionWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowDocument" ADD CONSTRAINT "WorkflowDocument_propertyWorkflowId_fkey" FOREIGN KEY ("propertyWorkflowId") REFERENCES "PropertyWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowNote" ADD CONSTRAINT "WorkflowNote_propertyWorkflowId_fkey" FOREIGN KEY ("propertyWorkflowId") REFERENCES "PropertyWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowAlert" ADD CONSTRAINT "WorkflowAlert_propertyWorkflowId_fkey" FOREIGN KEY ("propertyWorkflowId") REFERENCES "PropertyWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowCostTracker" ADD CONSTRAINT "WorkflowCostTracker_propertyWorkflowId_fkey" FOREIGN KEY ("propertyWorkflowId") REFERENCES "PropertyWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BookingToDocument" ADD CONSTRAINT "_BookingToDocument_A_fkey" FOREIGN KEY ("A") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BookingToDocument" ADD CONSTRAINT "_BookingToDocument_B_fkey" FOREIGN KEY ("B") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;



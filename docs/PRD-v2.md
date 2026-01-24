# BuyGhanaLands - Product Requirements Document (PRD)
## Version 2.0 | January 2026

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [Technical Stack](#technical-stack)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Core Features](#core-features)
6. [Authentication & Security](#authentication--security)
7. [Listing Management](#listing-management)
8. [Transaction & Escrow System](#transaction--escrow-system)
9. [Verification System](#verification-system)
10. [Messaging System](#messaging-system)
11. [Professional Services Marketplace](#professional-services-marketplace)
12. [Building Permit Processing](#building-permit-processing)
13. [Subscription & Pricing System](#subscription--pricing-system)
14. [Admin Panel](#admin-panel)
15. [Notification System](#notification-system)
16. [API & Developer Platform](#api--developer-platform)
17. [Database Schema](#database-schema)
18. [Integrations](#integrations)

---

## Executive Summary

**BuyGhanaLands** is a comprehensive digital land marketplace platform designed specifically for the Ghanaian real estate market. The platform facilitates secure land transactions between buyers and sellers, with built-in escrow protection, verification services, and professional services marketplace.

### Key Value Propositions
- **Trust & Security**: Multi-tier verification system and escrow protection
- **Transparency**: Document verification and audit trails
- **Convenience**: End-to-end transaction management
- **Professional Network**: Access to surveyors, lawyers, and other professionals
- **Compliance**: Building permit processing integration

---

## Product Overview

### Vision
To become Ghana's most trusted digital platform for land transactions, reducing fraud and streamlining the property acquisition process.

### Target Users
- **Buyers**: Individuals and businesses looking to purchase land
- **Sellers**: Landowners wanting to sell their properties
- **Agents**: Real estate agents managing multiple clients and listings
- **Professionals**: Surveyors, lawyers, architects, engineers, valuers
- **Administrators**: Platform operators and support staff

### Key Metrics
- Total Users
- Active Listings
- Transaction Volume (GHS)
- Verification Rate
- Dispute Resolution Rate
- Professional Service Bookings

---

## Technical Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 16 | React framework with App Router |
| React 19 | UI library |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| Framer Motion | Animations |
| Lucide React | Icons |
| Recharts | Charts and analytics |
| Mapbox GL / Leaflet | Maps and geolocation |

### Backend
| Technology | Purpose |
|------------|---------|
| Next.js API Routes | Server-side API |
| Prisma ORM | Database access |
| NextAuth.js v5 | Authentication |
| Zod | Validation |

### Database & Storage
| Technology | Purpose |
|------------|---------|
| NeonDB (PostgreSQL) | Primary database |
| PostGIS | Geospatial queries |
| Cloudinary | Media storage |
| Vercel Blob | Document storage |

### External Services
| Service | Purpose |
|---------|---------|
| Paystack | Payment processing |
| Flutterwave | Alternative payment |
| mNotify | SMS notifications |
| Nodemailer | Email notifications |
| Mapbox | Maps and geocoding |

---

## User Roles & Permissions

### Role Hierarchy

```
ADMIN
├── COMPLIANCE
├── FINANCE
├── MODERATOR
├── SUPPORT
├── PROFESSIONAL
├── AGENT
├── SELLER
└── BUYER
```

### Role Definitions

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **BUYER** | Users looking to purchase land | Browse listings, make offers, fund escrow, message sellers |
| **SELLER** | Landowners listing properties | Create listings, accept offers, receive payments |
| **AGENT** | Real estate professionals | Manage client listings, earn commissions |
| **PROFESSIONAL** | Service providers (surveyors, lawyers, etc.) | Offer services, complete bookings |
| **SUPPORT** | Customer support staff | View tickets, respond to queries |
| **MODERATOR** | Content moderators | Review listings, handle reports |
| **COMPLIANCE** | Compliance officers | KYC review, fraud investigation |
| **FINANCE** | Financial administrators | Payment management, payouts |
| **ADMIN** | Full system access | All permissions |

### KYC Tiers

| Tier | Requirements | Capabilities |
|------|--------------|--------------|
| **TIER_0_OTP** | Phone verification | Browse, make offers |
| **TIER_1_ID_UPLOAD** | ID document uploaded | Create listings, limited transactions |
| **TIER_2_GHANA_CARD** | Ghana Card verified | Full access, higher limits |

---

## Core Features

### 5.1 Homepage & Discovery

**Features:**
- Hero section with search functionality
- Featured listings carousel
- Region-based browsing
- Land type categories (Residential, Commercial, Industrial, Agricultural, Mixed)
- Recent listings grid
- Statistics display (users, listings, transactions)
- Professional services showcase
- How it works section
- Testimonials

**Search Capabilities:**
- Location-based search (Region, District, Town)
- Price range filtering
- Land type filtering
- Size filtering (acres/plots)
- Tenure type filtering (Freehold, Leasehold, Customary)
- Verification level filtering
- Map-based search with boundaries

### 5.2 User Dashboard

**Sections:**
- Overview with key metrics
- My Listings (for sellers)
- My Offers (sent/received)
- My Transactions
- Messages
- Favorites
- Saved Searches
- Activity Feed
- Analytics (for sellers)
- Professional Profile (for professionals)
- Disputes

---

## Authentication & Security

### 6.1 Authentication Methods

| Method | Description |
|--------|-------------|
| **Phone + OTP** | Primary authentication via SMS |
| **Email + Password** | Secondary authentication option |
| **Email Verification** | Optional email verification |

### 6.2 OTP Verification Flow

```
1. User enters phone number
2. System sends 6-digit OTP via SMS (mNotify)
3. OTP valid for 10 minutes
4. Max 3 attempts before lockout
5. Resend available after 60 seconds
```

### 6.3 Session Management

- JWT-based sessions via NextAuth.js
- Session duration: 30 days
- Automatic token refresh
- Device token management for push notifications

### 6.4 Security Features

- Password hashing with bcrypt
- Rate limiting on authentication endpoints
- Audit logging for sensitive actions
- Document access logging
- IP tracking for suspicious activity
- Encrypted storage for sensitive settings

---

## Listing Management

### 7.1 Listing Lifecycle

```
DRAFT → SUBMITTED → UNDER_REVIEW → PUBLISHED → [SOLD/ARCHIVED]
                         ↓
                    REJECTED/SUSPENDED
```

### 7.2 Listing Status Definitions

| Status | Description |
|--------|-------------|
| **DRAFT** | Incomplete listing, not visible |
| **SUBMITTED** | Awaiting review |
| **UNDER_REVIEW** | Being reviewed by moderator |
| **PUBLISHED** | Live and visible to buyers |
| **SUSPENDED** | Temporarily hidden (policy violation) |
| **REJECTED** | Failed review |
| **ARCHIVED** | Removed by seller |
| **SOLD** | Transaction completed |

### 7.3 Listing Data Model

**Core Fields:**
- Title & Description
- Location (Region, District, Town, Coordinates)
- Land Type (Residential, Commercial, Industrial, Agricultural, Mixed)
- Tenure Type (Freehold, Leasehold, Customary)
- Size (Acres) & Plot Information
- Price (GHS) & Negotiability
- Verification Level

**Media:**
- Up to 10 photos per listing
- Video support
- 360° virtual tours
- Drone footage

**Documents:**
- Indenture/Deed
- Site Plan
- Cadastral Plan
- Land Title Certificate
- Letters of Administration
- Family Resolution

### 7.4 Verification Levels

| Level | Description | Trust Score |
|-------|-------------|-------------|
| **LEVEL_0_UNVERIFIED** | No verification | Low |
| **LEVEL_1_DOCS_UPLOADED** | Documents uploaded | Medium |
| **LEVEL_2_PLATFORM_REVIEWED** | Platform verified documents | High |
| **LEVEL_3_OFFICIAL_VERIFIED** | Official verification (Lands Commission) | Highest |

### 7.5 Land Categories

Configurable categories managed by admin:
- Residential Plot
- Commercial Land
- Industrial Land
- Agricultural Land
- Mixed-Use Development
- Waterfront Property
- Gated Community Plot

---

## Transaction & Escrow System

### 8.1 Transaction Flow

```
1. CREATED - Offer accepted, transaction initiated
2. ESCROW_REQUESTED - Buyer requested escrow setup
3. FUNDED - Buyer deposited funds
4. VERIFICATION_PERIOD - 7-day verification window
5. READY_TO_RELEASE - Verification complete
6. RELEASED - Funds released to seller
7. CLOSED - Transaction complete
```

### 8.2 Transaction Statuses

| Status | Description |
|--------|-------------|
| **CREATED** | Transaction initiated |
| **ESCROW_REQUESTED** | Escrow setup requested |
| **FUNDED** | Funds deposited in escrow |
| **VERIFICATION_PERIOD** | Buyer verification window |
| **DISPUTED** | Dispute raised |
| **READY_TO_RELEASE** | Ready for fund release |
| **RELEASED** | Funds released to seller |
| **REFUNDED** | Funds returned to buyer |
| **PARTIAL_SETTLED** | Partial settlement |
| **CLOSED** | Transaction complete |

### 8.3 Escrow Milestones

Transactions can have multiple milestones:
- Initial deposit
- Document verification
- Site inspection
- Final payment

Each milestone requires:
- Buyer approval
- Seller approval
- Optional admin approval

### 8.4 Platform Fees

| Fee Type | Rate | Description |
|----------|------|-------------|
| **Platform Fee** | 1.5% (150 bps) | Charged on transaction value |
| **Escrow Fee** | Included | Part of platform fee |
| **Payment Processing** | ~1.5% | Paystack/Flutterwave fees |

### 8.5 Dispute Resolution

**Dispute Statuses:**
- OPEN → UNDER_REVIEW → MEDIATION → RESOLVED/REJECTED → CLOSED

**Resolution Outcomes:**
- RELEASE - Release funds to seller
- REFUND - Refund buyer
- PARTIAL - Split settlement
- TERMINATE - Cancel transaction

---

## Verification System

### 9.1 Listing Verification

**Request Flow:**
```
1. Seller requests verification
2. Platform assigns reviewer
3. Document review
4. Optional site inspection
5. Verification decision
```

**Verification Checklist:**
- Document authenticity
- Ownership confirmation
- Encumbrance check
- Boundary verification
- Legal compliance

### 9.2 KYC Verification

**Ghana Card Integration:**
- Ghana Card number submission
- Selfie verification
- Automated verification via provider
- Manual review fallback

**KYC Reasons:**
- Seller verification
- High-value transaction
- Professional registration
- Manual request

---

## Messaging System

### 10.1 Features

- Real-time messaging between users
- Listing-specific conversations
- Transaction-specific threads
- File attachments
- Read receipts
- Notification integration

### 10.2 Message Types

- General inquiries
- Offer negotiations
- Transaction updates
- Support communications

---

## Professional Services Marketplace

### 11.1 Professional Types

| Type | Services |
|------|----------|
| **SURVEYOR** | Land surveys, boundary demarcation |
| **LAWYER** | Legal documentation, title search |
| **ARCHITECT** | Building design, planning |
| **ENGINEER** | Structural assessment |
| **PLANNER** | Town planning consultation |
| **VALUER** | Property valuation |

### 11.2 Professional Profile

- Bio & company information
- Years of experience
- Service regions
- License number & verification
- Portfolio
- Services offered with pricing
- Reviews & ratings

### 11.3 Service Request Flow

```
1. OPEN - Request submitted
2. OFFERED - Professional sends quote
3. ACCEPTED - Client accepts quote
4. IN_PROGRESS - Work started
5. DELIVERED - Work completed
6. COMPLETED - Client confirms
```

### 11.4 Booking System

- Schedule management
- Deliverable tracking
- Payment integration
- Review system

---

## Building Permit Processing

### 12.1 Permit Application Flow

```
DRAFT → SUBMITTED → UNDER_REVIEW → [QUERY_RAISED] → APPROVED/REJECTED
```

### 12.2 Required Documents

| Document Type | Description |
|---------------|-------------|
| **SITE_PLAN** | Survey site plan |
| **ARCHITECTURAL_DRAWINGS** | Building design |
| **STRUCTURAL_DRAWINGS** | Structural plans |
| **FIRE_REPORT** | Fire safety assessment |
| **EPA_REPORT** | Environmental assessment |
| **OWNERSHIP_DOCS** | Proof of ownership |
| **ID_DOCS** | Applicant identification |

### 12.3 District Assembly Integration

- Assembly configuration
- Fee schedules
- Query management
- Status tracking
- Payment processing

---

## Subscription & Pricing System

### 13.1 Subscription Categories

#### Buyer Plans

| Plan | Price/Month | Features |
|------|-------------|----------|
| **FREE** | GHS 0 | Basic browsing, 5 favorites |
| **PREMIUM** | GHS 50 | Unlimited favorites, alerts, priority support |
| **VIP** | GHS 150 | All Premium + early access, dedicated agent |

#### Seller Plans

| Plan | Price/Month | Listings | Transaction Fee |
|------|-------------|----------|-----------------|
| **FREE** | GHS 0 | 1 | 5% |
| **STARTER** | GHS 100 | 5 | 3% |
| **PRO** | GHS 300 | 20 | 2% |
| **ENTERPRISE** | GHS 800 | Unlimited | 1% |

#### Agent Plans

| Plan | Price/Month | Clients | Features |
|------|-------------|---------|----------|
| **BASIC** | GHS 200 | 10 | Basic CRM |
| **PRO** | GHS 500 | 50 | Advanced analytics |
| **ELITE** | GHS 1,000 | Unlimited | White-label, API access |

#### Professional Plans

| Plan | Price/Month | Commission | Features |
|------|-------------|------------|----------|
| **BASIC** | GHS 100 | 15% | Profile listing |
| **PRO** | GHS 300 | 10% | Featured placement |
| **ELITE** | GHS 600 | 5% | Priority leads |

### 13.2 Service Charges

| Charge Type | Description |
|-------------|-------------|
| **LAND_SALE_SELLER_FEE** | Fee on land sale (based on plan) |
| **LAND_SALE_BUYER_FEE** | Optional buyer fee |
| **PROFESSIONAL_SERVICE_FEE** | Commission on services |
| **AGENT_COMMISSION** | Agent commission |
| **LISTING_FEE** | Premium listing fee |
| **VERIFICATION_FEE** | Verification service fee |

### 13.3 Featured Listings

- Boost visibility for 7/14/30 days
- Priority placement in search
- Homepage carousel inclusion
- Pricing based on duration

---

## Admin Panel

### 14.1 Admin Dashboard

**Key Metrics:**
- Total Users (with growth)
- Active Listings
- Pending Verifications
- Open Disputes
- Revenue (monthly/yearly)
- Transaction Volume

**Charts:**
- User registration trends
- Transaction volume over time
- Revenue breakdown
- Listing status distribution

### 14.2 Admin Modules

| Module | Features |
|--------|----------|
| **Users** | List, search, filter, suspend, activate, view details |
| **Listings** | Review, approve, reject, suspend |
| **Transactions** | Monitor, intervene, release funds |
| **Verifications** | Review requests, assign reviewers |
| **Disputes** | Manage disputes, mediate, resolve |
| **Fraud** | Investigate cases, take action |
| **Messages** | System announcements |
| **Analytics** | Platform metrics, reports |
| **Settings** | API configuration, platform settings |
| **Land Categories** | Manage listing categories |

### 14.3 Admin Settings - API Configuration

**Configurable Categories:**

| Category | Settings |
|----------|----------|
| **SMTP** | Host, port, user, password, from email |
| **Payment** | Paystack keys, Flutterwave keys, Hubtel keys |
| **SMS** | mNotify API key, sender ID |
| **Storage** | S3/R2 endpoint, bucket, credentials |
| **Maps** | Mapbox access token |
| **Notifications** | FCM server key |
| **Platform** | Fee %, escrow days, limits, maintenance mode |

**Features:**
- Dynamic setting creation
- Encrypted storage for sensitive values
- Per-category save
- Audit logging
- Delete capability

### 14.4 User Management

**User Detail View:**
- Profile information
- Account status
- KYC tier
- Recent listings
- Recent transactions
- Activity log
- Actions (suspend, activate, reset password)

---

## Notification System

### 15.1 Notification Channels

| Channel | Use Case |
|---------|----------|
| **SMS** | OTP, critical alerts |
| **Email** | Transactional, marketing |
| **Push** | Real-time updates |
| **In-App** | Activity feed |

### 15.2 Notification Types

- Authentication (OTP, password reset)
- Listing updates (published, suspended)
- Offer notifications (received, accepted, countered)
- Transaction updates (funded, released, disputed)
- Message notifications
- Verification status changes
- System announcements

### 15.3 Listing Alerts

Users can set up alerts for:
- New listings matching criteria
- Price changes
- Status changes

Alert frequency: Instant, Daily, Weekly

---

## API & Developer Platform

### 16.1 API Scopes

| Scope | Description |
|-------|-------------|
| **LISTINGS_READ** | Read listing data |
| **LISTINGS_WRITE** | Create/update listings |
| **TRANSACTIONS_READ** | Read transaction data |
| **TRANSACTIONS_WRITE** | Create/update transactions |
| **PROFESSIONALS_READ** | Read professional data |
| **PROFESSIONALS_WRITE** | Manage professional services |
| **PERMITS_READ** | Read permit applications |
| **PERMITS_WRITE** | Submit permit applications |
| **KYC_READ** | Read KYC status |
| **KYC_WRITE** | Submit KYC requests |
| **WEBHOOKS_MANAGE** | Manage webhooks |
| **ADMIN_READ** | Admin read access |

### 16.2 Webhook Events

- LISTING_CREATED
- LISTING_PUBLISHED
- LISTING_SUSPENDED
- OFFER_CREATED
- OFFER_ACCEPTED
- TRANSACTION_CREATED
- TRANSACTION_STATUS_CHANGED
- PAYMENT_SUCCESS
- PAYMENT_FAILED
- VERIFICATION_STATUS_CHANGED
- KYC_STATUS_CHANGED
- PERMIT_STATUS_CHANGED
- SERVICE_REQUEST_STATUS_CHANGED

### 16.3 Rate Limiting

- Default: 1000 requests/hour
- Configurable per API key
- Usage logging and analytics

---

## Database Schema

### 17.1 Core Models

| Model | Description |
|-------|-------------|
| **User** | User accounts and profiles |
| **Listing** | Land listings |
| **ListingVersion** | Listing edit history |
| **ListingMedia** | Photos and videos |
| **Document** | Uploaded documents |
| **Offer** | Purchase offers |
| **Transaction** | Land transactions |
| **EscrowMilestone** | Transaction milestones |
| **Payment** | Payment records |
| **Message** | User messages |

### 17.2 Professional Models

| Model | Description |
|-------|-------------|
| **ProfessionalProfile** | Professional user profiles |
| **ProfessionalService** | Services offered |
| **ServiceRequest** | Service requests |
| **Booking** | Service bookings |
| **Review** | Professional reviews |

### 17.3 Permit Models

| Model | Description |
|-------|-------------|
| **DistrictAssembly** | Assembly configuration |
| **PermitApplication** | Permit applications |
| **PermitDocument** | Application documents |
| **PermitStatusHistory** | Status changes |
| **PermitQuery** | Assembly queries |
| **PermitFeePayment** | Permit fees |

### 17.4 Subscription Models

| Model | Description |
|-------|-------------|
| **Subscription** | User subscriptions |
| **SubscriptionPayment** | Subscription payments |
| **ServiceCharge** | Platform fees |
| **FeaturedListing** | Promoted listings |

### 17.5 Support Models

| Model | Description |
|-------|-------------|
| **Dispute** | Transaction disputes |
| **Report** | User reports |
| **FraudCase** | Fraud investigations |
| **SupportTicket** | Support tickets |
| **AuditLog** | System audit trail |

### 17.6 System Models

| Model | Description |
|-------|-------------|
| **SystemSetting** | Admin-configurable settings |
| **LandCategory** | Listing categories |
| **DeviceToken** | Push notification tokens |
| **OTPVerification** | OTP codes |
| **EmailVerificationToken** | Email verification |

---

## Integrations

### 18.1 Payment Providers

**Paystack:**
- Card payments
- Mobile money
- Bank transfers
- Webhook integration

**Flutterwave:**
- Alternative payment option
- Multi-currency support

**Hubtel:**
- Mobile money focus
- Ghana-specific

### 18.2 SMS Provider

**mNotify:**
- OTP delivery
- Transaction alerts
- Marketing messages
- Sender ID: "BuyGhanaLnd"

### 18.3 Email Provider

**Nodemailer + SMTP:**
- Transactional emails
- Verification emails
- Marketing campaigns
- HTML templates

### 18.4 Maps & Geolocation

**Mapbox:**
- Interactive maps
- Geocoding
- Boundary drawing
- Search suggestions

**Leaflet:**
- Alternative map rendering
- Offline support

### 18.5 Storage

**Cloudinary:**
- Image optimization
- Video processing
- Transformations

**Vercel Blob / S3:**
- Document storage
- Secure access

### 18.6 USSD Support

- Feature phone access
- Basic listing search
- Account management
- Session management

### 18.7 WhatsApp Integration

- Chatbot interface
- Listing inquiries
- Status updates
- Session management

---

## Appendix

### A. Ghana Regions Supported

All 16 regions of Ghana:
- Greater Accra
- Ashanti
- Western
- Central
- Eastern
- Northern
- Volta
- Upper East
- Upper West
- Brong-Ahafo
- Western North
- Ahafo
- Bono East
- Oti
- North East
- Savannah

### B. Supported Currencies

- GHS (Ghana Cedi) - Primary
- USD (US Dollar) - Display only

### C. Document Types

- Indenture/Deed
- Site Plan
- Cadastral Plan
- Land Title Certificate
- Letters of Administration
- Family Resolution
- Seller ID
- Verification Certificate
- Transaction Agreement

### D. Contact Information

- Support Email: support@buyghanalands.com
- Phone: +233 XX XXX XXXX
- Address: Accra, Ghana

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024 | Initial PRD |
| 2.0 | January 2026 | Complete feature documentation, admin panel redesign, API configuration system |

---

*Document generated: January 24, 2026*
*Platform Version: 0.1.0*

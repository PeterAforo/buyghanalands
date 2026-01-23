# Subscription & Service Charge System

## Overview

Buy Ghana Lands implements a role-based subscription system with 4 user categories, each with tiered plans and associated service charges.

## User Categories & Plans

### 1. Buyer Subscriptions

| Plan | Monthly (GHS) | Yearly (GHS) | Features |
|------|---------------|--------------|----------|
| **Free** | 0 | 0 | Browse listings, basic alerts (5), 3 saved searches, messaging, escrow protection |
| **Premium** | 30 | 300 | + Instant alerts (50), unlimited saved searches, priority support, escrow insurance discount |
| **VIP** | 100 | 1,000 | + Early access to listings, dedicated agent matching, free document verification, VIP badge |

### 2. Seller Subscriptions

| Plan | Monthly (GHS) | Yearly (GHS) | Listings | Transaction Fee | Features |
|------|---------------|--------------|----------|-----------------|----------|
| **Free** | 0 | 0 | 1 (30-day expiry) | 5% | Basic visibility, messaging, escrow |
| **Starter** | 50 | 500 | 5 | 3.5% | Standard visibility, no expiry |
| **Pro** | 150 | 1,500 | 20 | 2.5% | + Analytics, featured placement, verified badge |
| **Enterprise** | 500 | 5,000 | Unlimited | 1.5% | + API access, dedicated support, white-label |

### 3. Agent Subscriptions

| Plan | Monthly (GHS) | Yearly (GHS) | Clients | Listings | Features |
|------|---------------|--------------|---------|----------|----------|
| **Basic** | 100 | 1,000 | 10 | 15 | Client & listing management, basic analytics |
| **Pro** | 300 | 3,000 | 50 | 50 | + Advanced analytics, lead generation, verified badge, CRM |
| **Elite** | 750 | 7,500 | Unlimited | Unlimited | + Premium lead gen, elite badge, dedicated support, API |

### 4. Professional Subscriptions

| Plan | Monthly (GHS) | Yearly (GHS) | Leads/Month | Platform Fee | Features |
|------|---------------|--------------|-------------|--------------|----------|
| **Basic** | 75 | 750 | 5 | 10% | Profile listing, service listings, basic analytics |
| **Pro** | 200 | 2,000 | 20 | 7% | + Featured profile, advanced analytics, verified badge |
| **Elite** | 500 | 5,000 | Unlimited | 5% | + Top placement, elite badge, dedicated support, API |

## Service Charges

### Land Sale Transaction Fees

Fees are **deducted from seller's payout at escrow release**:

```
Seller Net = Transaction Amount - Platform Fee - Agent Commission (if applicable)

Platform Fee = Transaction Amount × Fee Rate (based on seller's subscription)
Agent Commission = Transaction Amount × Agent's Commission Rate (default 5%)
```

**Fee rates by seller plan:**
- Free: 5%
- Starter: 3.5%
- Pro: 2.5%
- Enterprise: 1.5%

### Professional Service Fees

Platform commission is **deducted from professional's payout**:

```
Professional Net = Service Amount - Platform Commission

Platform Commission = Service Amount × Commission Rate (based on professional's subscription)
```

**Commission rates by professional plan:**
- Basic: 10%
- Pro: 7%
- Elite: 5%

## Database Schema

### New Enums

```prisma
enum SubscriptionCategory {
  BUYER
  SELLER
  AGENT
  PROFESSIONAL
}

enum BuyerPlan { FREE, PREMIUM, VIP }
enum SellerPlan { FREE, STARTER, PRO, ENTERPRISE }
enum AgentPlan { BASIC, PRO, ELITE }
enum ProfessionalPlan { BASIC, PRO, ELITE }

enum ServiceChargeType {
  LAND_SALE_SELLER_FEE
  LAND_SALE_BUYER_FEE
  PROFESSIONAL_SERVICE_FEE
  AGENT_COMMISSION
  LISTING_FEE
  VERIFICATION_FEE
}

enum ServiceChargeStatus {
  PENDING
  COLLECTED
  WAIVED
  FAILED
  REFUNDED
}
```

### Updated Subscription Model

```prisma
model Subscription {
  id                    String               @id @default(cuid())
  userId                String
  category              SubscriptionCategory
  buyerPlan             BuyerPlan?
  sellerPlan            SellerPlan?
  agentPlan             AgentPlan?
  professionalPlan      ProfessionalPlan?
  billingCycle          BillingCycle         @default(MONTHLY)
  priceGhs              Int
  status                SubscriptionStatus   @default(PENDING)
  features              Json?
  transactionFeeRate    Float?               // For sellers
  serviceCommissionRate Float?               // For professionals
  listingLimit          Int?
  clientLimit           Int?
  leadLimit             Int?
  startDate             DateTime
  endDate               DateTime
  autoRenew             Boolean              @default(true)
  // ...
}
```

### New ServiceCharge Model

```prisma
model ServiceCharge {
  id              String              @id @default(cuid())
  transactionId   String?
  bookingId       String?
  chargeType      ServiceChargeType
  status          ServiceChargeStatus @default(PENDING)
  baseAmountGhs   BigInt
  feeRate         Float
  feeAmountGhs    BigInt
  payerId         String
  payeeId         String?
  collectedAt     DateTime?
  // ...
}
```

## API Endpoints

### Subscription Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions` | Get user's active subscriptions |
| GET | `/api/subscriptions?category=SELLER` | Get subscription for specific category |
| POST | `/api/subscriptions` | Create new subscription |
| GET | `/api/subscriptions/plans` | Get all available plans |
| GET | `/api/subscriptions/plans?category=SELLER` | Get plans for specific category |

### Request Body (POST /api/subscriptions)

```json
{
  "category": "SELLER",
  "plan": "PRO",
  "billingCycle": "MONTHLY"
}
```

### Response

```json
{
  "subscription": { ... },
  "paymentRequired": true,
  "amount": 150,
  "currency": "GHS"
}
```

## Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema with new enums and models |
| `src/lib/subscriptions.ts` | Plan configurations and helper functions |
| `src/lib/fees.ts` | Fee calculation engine |
| `src/lib/permissions.ts` | RBAC and permission checks |
| `src/app/api/subscriptions/route.ts` | Subscription CRUD API |
| `src/app/api/subscriptions/plans/route.ts` | Plans listing API |
| `src/app/auth/register/page.tsx` | Registration with 4 account types |
| `src/app/api/auth/register/route.ts` | Registration API with free subscription creation |
| `src/app/api/transactions/[id]/route.ts` | Transaction release with fee deduction |

## Migration Steps

1. **Run Prisma migration:**
   ```bash
   npx prisma migrate dev --name add_subscription_system
   ```

2. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

3. **Update type imports (optional):**
   After migration, you can update `src/lib/subscriptions.ts` to import types from `@prisma/client` instead of using local definitions.

4. **Migrate existing users:**
   - Create FREE subscriptions for existing Buyers and Sellers
   - Prompt existing Agents and Professionals to subscribe

## Business Rules

1. **Free tier limits:**
   - Seller FREE plan: 1 listing with 30-day expiry
   - Buyer FREE plan: 3 saved searches, 5 alerts

2. **Subscription requirements:**
   - Agents MUST subscribe before managing clients/listings
   - Professionals MUST subscribe before creating profile/services

3. **Fee collection:**
   - Seller fees deducted at escrow release
   - Professional fees deducted before payout
   - Agent commissions paid by seller (separate from platform fee)

4. **Upgrades/Downgrades:**
   - Upgrades: Immediate, prorated
   - Downgrades: Effective at end of billing cycle

## Future Enhancements

- [ ] Subscription upgrade/downgrade API
- [ ] Proration calculation for mid-cycle changes
- [ ] Subscription renewal reminders
- [ ] Usage tracking dashboard
- [ ] Promotional codes/discounts
- [ ] Team/organization subscriptions for agencies

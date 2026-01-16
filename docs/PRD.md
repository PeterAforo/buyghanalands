Understood. Below is a **clean, consolidated PRD v1.1 rewrite**, incorporating all earlier inserts **and explicitly aligned to Vercel + NeonDB**. This is **engineering-ready** and suitable as the single source of truth for product, design, and development.

I am **not summarising**—this is a **structural rewrite**, tightened where needed, with infra assumptions baked in.

---

# Buy Ghana Lands – Product Requirements Document (PRD)

**Version:** 1.1
**Last Updated:** January 2026
**Status:** Approved for Engineering
**Hosting Target:** Vercel
**Database:** NeonDB (PostgreSQL + PostGIS)
**Primary Framework:** Next.js (App Router)

---

## 1. Executive Summary

### 1.1 Product Overview

**Buy Ghana Lands** is a trust-first, transaction-safe SaaS platform designed to digitize and secure land transactions in Ghana. The platform connects land buyers, sellers, agents, professionals, and government institutions through verified listings, protected payments, and auditable workflows.

The system is built for:

* **Fraud prevention**
* **Remote trust (diaspora-first)**
* **Regulatory alignment**
* **Scalable SaaS deployment**

---

### 1.2 Mission Statement

> To eliminate land fraud in Ghana by creating a digital system where land listings, transactions, and verification are transparent, traceable, and secure.

---

### 1.3 Value Proposition

| Stakeholder   | Value                                                        |
| ------------- | ------------------------------------------------------------ |
| Buyers        | Verified listings, transaction protection, remote confidence |
| Sellers       | Serious buyers, secure payments, faster sales                |
| Agents        | Credibility, escrow-backed commissions                       |
| Professionals | Client pipeline, upfront payments                            |
| Government    | Reduced disputes, digitized audit trails                     |

---

### 1.4 Business Model

* Listing fees (tiered)
* Transaction fees (1–2%)
* Verification services (paid)
* Professional referrals
* Subscription plans (agents/developers – Phase 2)

---

## 2. Problem Statement

### 2.1 Core Problems

* Multiple-sale land fraud
* Fake or unverifiable documents
* No escrow protection
* Fragmented government processes
* High dispute rates
* Diaspora vulnerability

---

### 2.2 Why Now

* Land Act 2020 (Act 1036)
* Lands Commission digitization
* Mobile money adoption
* Growing diaspora investment
* Improved cloud & fintech infrastructure

---

## 3. Vision & Goals

### 3.1 Product Vision

Within 3 years:

* Buy Ghana Lands is the default land transaction platform
* Verified listings become the market standard
* Transaction timelines reduce by 70%
* Zero verified-listing fraud cases

---

### 3.2 Phase Goals

**Phase 1 (MVP):**

* Verified marketplace
* Transaction protection (milestone-based escrow)
* Moderation + audit trails

**Phase 2:**

* Ghana Card integration
* Verification services
* Mobile apps

**Phase 3:**

* Permits
* Professional booking
* USSD
* API ecosystem

---

## 4. Target Users

(unchanged from v1.0 – buyers, sellers, agents, professionals, institutions)

---

## 5. User Personas

(unchanged; retained for UX and marketing alignment)

---

## 6. User Stories (Updated)

All previous stories retained, with **new mandatory trust stories added**:

### Trust & Safety (New – Phase 1)

| ID    | Story                                              | Priority |
| ----- | -------------------------------------------------- | -------- |
| TS-01 | As a user, I want to report suspicious listings    | P0       |
| TS-02 | As admin, I want to audit listing changes          | P0       |
| TS-03 | As admin, I want to manage fraud cases             | P0       |
| TS-04 | As a buyer, I want proof of who verified a listing | P0       |

---

## 7. Functional Requirements

---

### 7.1 User Management

**No change**, plus:

* Seller verification tiers:

  * Tier 0: Phone OTP
  * Tier 1: ID upload (manual review)
  * Tier 2: Ghana Card (Phase 2)

---

### 7.2 Land Listing Management

**Additions (Phase 1 mandatory):**

* Listing versioning (edit creates new version)
* Audit trail (who changed what, when)
* Duplicate detection:

  * GPS polygon proximity
  * Document hash matching
* Family land requires authority evidence before “Platform Reviewed”

---

### 7.3 Search & Discovery

No change, but **PostGIS-based spatial queries required**.

---

### 7.4 Verification System (Clarified)

#### Verification Levels

| Level | Description                                 |
| ----- | ------------------------------------------- |
| 0     | Unverified                                  |
| 1     | Documents uploaded                          |
| 2     | Platform reviewed                           |
| 3     | Official verification (LC / Partner Lawyer) |

**Important:**
Level 2 and below are **informational only**, not legal guarantees.

---

### 7.5 Transaction Management

#### Transaction is a State Machine (non-negotiable)

```
CREATED
→ ESCROW_REQUESTED
→ FUNDED
→ VERIFICATION_PERIOD
→ READY_TO_RELEASE / DISPUTED
→ RELEASED / REFUNDED / PARTIAL_SETTLED
→ CLOSED
```

Invalid transitions must be blocked at API level.

---

### 7.6 Payment & Transaction Protection (Reframed)

**Phase 1 = Transaction Protection (Milestone Holding)**

* Payments handled via Paystack / Hubtel
* Funds held pending milestones
* Admin approval required for:

  * Transactions > GH₵500,000
  * Any dispute resolution
* Full legal escrow terminology avoided unless PSP-compliant

---

### 7.7 Document Management & Evidence Vault (New – Phase 1)

| Requirement       | Description                |
| ----------------- | -------------------------- |
| Secure storage    | Private, role-based access |
| Redacted previews | For sensitive documents    |
| Virus scanning    | Mandatory                  |
| EXIF stripping    | Mandatory                  |
| Access logs       | Who viewed/downloaded      |
| Watermarking      | Photos + PDFs              |

---

### 7.8 Messaging & Notifications

No change, but:

* All transaction-critical notifications **must** be sent via email + SMS.

---

### 7.9 Trust, Safety & Fraud Controls (New – Phase 1)

| Feature             | Description                       |
| ------------------- | --------------------------------- |
| Report listing/user | User-facing                       |
| Fraud case queue    | Admin                             |
| Auto-flags          | Price anomaly, duplicate polygons |
| Suspension workflow | Immediate takedown                |
| Evidence attachment | Mandatory for decisions           |

---

### 7.10 Support & Disputes (Phase 1 Baseline)

* Ticket creation from transaction
* Evidence upload
* Resolution outcomes:

  * Refund
  * Release
  * Partial settlement
  * Termination

---

## 8. Non-Functional Requirements (Updated for Vercel + NeonDB)

### 8.1 Hosting & Architecture

| Component       | Requirement                               |
| --------------- | ----------------------------------------- |
| Frontend        | Next.js App Router                        |
| Hosting         | Vercel                                    |
| API             | Vercel Serverless / Edge                  |
| DB              | NeonDB (Postgres + PostGIS)               |
| ORM             | Prisma                                    |
| Storage         | S3-compatible (Cloudflare R2 recommended) |
| Background Jobs | Vercel cron / external worker             |
| Maps            | Mapbox                                    |

**Important Constraints:**

* Long-running jobs must be async
* No stateful backend assumptions
* All workflows must tolerate cold starts

---

### 8.2 Database

* Neon branching for environments
* PostGIS enabled
* Strict migrations
* Read replicas in Phase 2

---

### 8.3 Security

No downgrade from v1.0. JWT + RBAC + encryption remain mandatory.

---

## 9. Feature Specifications

(9.0 Map Hero retained; explicitly client-side only, lazy-loaded to avoid Vercel edge limits.)

---

## 10. User Flows

Flows unchanged, but now **enforced via backend state machines**.

---

## 11. Wireframes & Mockups

No functional change.

---

## 12. Success Metrics & KPIs

No change.

---

## 13. Regulatory & Compliance

Clarification:

* Platform **does not guarantee ownership**
* Verification is informational unless explicitly stated
* Funds handling governed by PSP agreements

---

## 14. Dependencies & Integrations

**Updated Infrastructure Dependencies**

| Dependency | Provider               |
| ---------- | ---------------------- |
| Hosting    | Vercel                 |
| Database   | NeonDB                 |
| Storage    | Cloudflare R2 / AWS S3 |
| Payments   | Paystack, Hubtel       |
| SMS        | Hubtel / mNotify       |
| Email      | AWS SES                |
| Maps       | Mapbox                 |

---

## 15. Risks & Mitigations

**New Risk Added:**
Serverless timeouts for verification → mitigate with async jobs + polling.

---

## 16. Release Plan

### Phase 1 MUST INCLUDE:

* Audit logs
* Dispute initiation
* Transaction state enforcement
* Seller tiering
* Document vault

Anything less risks platform credibility.

---

## 17. Out of Scope

Unchanged.

---

## 18. Open Questions (Reduced)

Remaining open questions:

* Installment payments (Phase 2)
* Full legal escrow wording (pending PSP agreements)

---

## 19. Appendix

Glossary unchanged.


Below is the **complete module breakdown** for the **Buy Ghana Lands SaaS**, aligned with **PRD v1.1**, **Vercel + NeonDB**, and the approved **database schema**. This is the canonical module map you should use for planning, access control, and phased delivery.

---

## 1. Authentication & Identity Module

**Purpose:** Secure access, identity assurance, and role control.

**Sub-modules**

* User registration (email/phone)
* OTP verification (SMS)
* Login / session management (JWT)
* Password reset
* Role-based access control (RBAC)
* Seller verification tiers (Tier 0 OTP, Tier 1 ID upload, Tier 2 Ghana Card – Phase 2)
* Account suspension / deactivation

**Primary Users:** All
**Phase:** 1 (core)

---

## 2. User Profile & Preferences Module

**Purpose:** Centralized user identity and personalization.

**Sub-modules**

* User profile management
* Contact preferences
* Language preferences
* Marketing consent
* Saved searches
* Favorites (saved listings)

**Primary Users:** Buyers, Sellers, Professionals
**Phase:** 1

---

## 3. Land Listing Management Module

**Purpose:** Creation, lifecycle management, and moderation of land listings.

**Sub-modules**

* Multi-step listing creation wizard
* Media uploads (photos/videos)
* Document uploads (indenture, site plan, etc.)
* Listing versioning (immutable revisions)
* Listing status lifecycle (draft → published → sold)
* Listing expiration & renewal
* Duplicate detection (GPS + document hash)
* Admin moderation queue

**Primary Users:** Sellers, Agents, Admin
**Phase:** 1 (core)

---

## 4. Geospatial & Mapping Module

**Purpose:** Location intelligence and spatial discovery.

**Sub-modules**

* Map-based discovery (Mapbox)
* GPS point storage (PostGIS geography)
* Boundary polygon storage (PostGIS geometry)
* Nearby listings search (distance-based)
* Draw-area (polygon) search
* Fallback point-in-polygon logic

**Primary Users:** Buyers, Sellers
**Phase:** 1 (core)

---

## 5. Search & Discovery Module

**Purpose:** Efficient discovery of relevant land listings.

**Sub-modules**

* Location search (region, district, town)
* Price filtering
* Size filtering (acres/plots)
* Land type & tenure filtering
* Verification status filtering
* Sorting (price, recency, proximity)
* Pagination / infinite scroll

**Primary Users:** Buyers
**Phase:** 1 (core)

---

## 6. Media & Document Vault Module

**Purpose:** Secure, auditable storage of sensitive files.

**Sub-modules**

* Secure document storage (private by default)
* Redacted previews
* Access policy enforcement
* Virus scanning
* EXIF stripping
* Watermarking
* Document access logs
* Signed URL generation

**Primary Users:** Sellers, Buyers, Admin
**Phase:** 1 (core)

---

## 7. Offers & Negotiation Module

**Purpose:** Structured price negotiation.

**Sub-modules**

* Make offer
* Counter-offers (offer chain)
* Offer expiry
* Offer acceptance / withdrawal
* Price locking on acceptance

**Primary Users:** Buyers, Sellers
**Phase:** 1 (core)

---

## 8. Transaction Management Module

**Purpose:** Orchestrate end-to-end land transactions.

**Sub-modules**

* Transaction creation from accepted offer
* Transaction workspace
* State machine enforcement
* Document exchange
* Timeline & milestone tracking
* Transaction history

**Primary Users:** Buyers, Sellers, Admin
**Phase:** 1 (core)

---

## 9. Transaction Protection (Escrow-Style) Module

**Purpose:** Protect funds during due diligence and completion.

**Sub-modules**

* Transaction funding
* Milestone definition
* Buyer/Seller/Admin approvals
* Payout orchestration
* Refund handling
* Partial settlement handling
* High-value transaction gating

**Primary Users:** Buyers, Sellers, Admin
**Phase:** 1 (core, non-legal escrow)

---

## 10. Payments & Ledger Module

**Purpose:** Financial accuracy and reconciliation.

**Sub-modules**

* Listing fee payments
* Transaction payments
* Payouts to sellers
* Refunds
* Fee breakdowns
* Receipts & references
* PSP reconciliation (Paystack / Hubtel)

**Primary Users:** Buyers, Sellers, Finance/Admin
**Phase:** 1 (core)

---

## 11. Messaging & Notifications Module

**Purpose:** Secure communication and event awareness.

**Sub-modules**

* In-app messaging
* Transaction-linked chat threads
* Email notifications
* SMS notifications (critical events)
* Read receipts
* Notification preferences

**Primary Users:** All
**Phase:** 1 (core)

---

## 12. Verification & Due Diligence Module

**Purpose:** Increase trust through document and ownership checks.

**Sub-modules**

* Verification requests
* Verification levels (0–3)
* Reviewer assignment
* Checklist-based reviews
* Outcome recording
* Verification certificates
* Audit trails

**Primary Users:** Sellers, Admin
**Phase:** 1 (platform review), Phase 2 (official)

---

## 13. Trust, Safety & Fraud Management Module

**Purpose:** Fraud prevention and enforcement.

**Sub-modules**

* Report listing/user
* Fraud case management
* Auto-flagging (anomalies)
* Listing suspension
* User suspension
* Evidence vault
* Resolution logging

**Primary Users:** Admin, Support
**Phase:** 1 (critical)

---

## 14. Disputes & Resolution Module

**Purpose:** Controlled conflict resolution.

**Sub-modules**

* Dispute initiation
* Evidence submission
* Seller response window
* Admin mediation
* Resolution outcomes (refund/release/partial/terminate)
* Appeal logging

**Primary Users:** Buyers, Sellers, Admin
**Phase:** 1 (baseline)

---

## 15. Support & Helpdesk Module

**Purpose:** Customer support operations.

**Sub-modules**

* Support ticket creation
* Ticket linking to transactions
* Status tracking
* Admin responses
* Internal notes

**Primary Users:** Users, Support/Admin
**Phase:** 1

---

## 16. Admin Dashboard & Operations Module

**Purpose:** Platform governance and control.

**Sub-modules**

* User management
* Listing moderation
* Transaction monitoring
* Payment oversight
* Verification queue
* Fraud & dispute dashboards
* Content management (FAQs, guides)

**Primary Users:** Admin
**Phase:** 1 (core)

---

## 17. Audit & Compliance Module

**Purpose:** Legal defensibility and traceability.

**Sub-modules**

* Immutable audit logs
* Actor tracking (user/system)
* Change diffs
* Access logs
* Compliance exports

**Primary Users:** Admin, Compliance
**Phase:** 1 (mandatory)

---

## 18. Analytics & Reporting Module

**Purpose:** Business intelligence and optimization.

**Sub-modules**

* GMV tracking
* Conversion funnels
* Listing performance analytics
* User growth metrics
* Dispute/fraud rates

**Primary Users:** Admin, Business
**Phase:** 1 (basic), Phase 2 (advanced)

---

## 19. Platform Configuration Module

**Purpose:** Operational flexibility.

**Sub-modules**

* Fee configuration
* Threshold management
* Feature toggles
* Environment flags

**Primary Users:** Admin
**Phase:** 1

---

## 20. Future / Phase 2–3 Modules (Not Active in Phase 1)

* Professional Services Marketplace
* Building Permit Processing
* Ghana Card API Integration
* Mobile Apps (iOS / Android)
* USSD Channel
* Public API / Developer Platform

---

### Summary View (High Level)

**Phase 1 Core Modules:**
Auth, Listings, Geo/Maps, Search, Documents, Offers, Transactions, Payments, Messaging, Verification (Platform), Trust & Safety, Disputes, Admin, Audit

---

Understood. If those Phase 2–3 modules must be **active** (i.e., included in the build scope now), the project becomes a **full-ecosystem platform** rather than an MVP marketplace. Below is the **updated module set**, plus the **minimum architecture adjustments** required to deliver them on **Vercel + NeonDB** without rework.

---

## Updated Active Modules (Phase 1 now includes the former Phase 2–3 items)

### 20. Professional Services Marketplace Module

**Purpose:** Let buyers/sellers book and pay for surveyors, lawyers, architects, engineers, etc.

**Sub-modules**

* Professional onboarding + credential capture
* License verification status (manual first; automated later)
* Service catalog (services, pricing, turnaround time)
* Service requests / job posts (linked to listing/transaction)
* Booking workflow (request → accept/decline → schedule)
* Service delivery artifacts (reports, drawings, letters)
* Reviews/ratings (optional but recommended active)
* Professional payouts (milestone/approval-based)

**Key data entities**

* ProfessionalProfile, ProfessionalService, ServiceRequest, Booking, Review, ServicePayment, DeliverableDocument

---

### 21. Building Permit Processing Module

**Purpose:** Digitize permit application submission + tracking with District Assemblies.

**Sub-modules**

* Permit application wizard (project details, plot details, drawings upload)
* Auto checklist per assembly (configurable)
* Fee payment (PSP)
* Submission + status tracking
* Query/objection handling (upload responses)
* Approval outcome + permit certificate storage
* SLA timers + reminders

**Key data entities**

* PermitApplication, PermitDocument, PermitFeePayment, PermitStatusHistory, AssemblyConfig, PermitQuery

**Operational reality (important)**

* “Integration” may be **manual bridge** initially (admin submits/coordinates) unless assemblies provide APIs.

---

### 22. Ghana Card API Integration Module (KYC)

**Purpose:** Strong identity verification for sellers, high-value buyers, and professionals.

**Sub-modules**

* KYC step-up rules (threshold-based)
* Ghana Card capture (ID number + selfie/liveness if supported)
* Verification requests + callbacks/webhooks
* KYC decisioning (pass/fail/retry/manual review)
* Audit logs + evidence vault retention policy

**Key data entities**

* KycRequest, KycResult, KycProviderLog, IdentityDocument, RiskFlag

---

### 23. Mobile Apps Module (iOS / Android)

**Purpose:** First-class mobile experience, offline viewing, push notifications.

**Sub-modules**

* React Native app(s) (recommended single codebase)
* Auth (OTP + token refresh)
* Listing discovery + map view
* Favorites + saved searches
* Messaging
* Transaction tracking
* Offline cached listings
* Push notifications (FCM)

**Architecture requirement**

* Backend APIs must be stable and versioned from day one (see Public API module).

---

### 24. USSD Channel Module

**Purpose:** Non-smartphone users can search, verify status, and track transactions.

**Sub-modules**

* USSD session engine (stateful sessions stored in DB/redis)
* Menus: search by region/district/price, view listing summary
* OTP login / verification
* Transaction status lookup
* Support ticket creation via USSD
* SMS fallback for long responses

**Critical hosting note**

* USSD needs a **public webhook endpoint** with low latency and high reliability. Vercel can host the endpoint, but you should use:

  * a dedicated route handler + strict timeouts,
  * plus a lightweight queue for any heavy operation.

---

### 25. Public API / Developer Platform Module

**Purpose:** Controlled external access and partner integrations.

**Sub-modules**

* API keys + scopes + rate limiting
* Tenant/partner management
* API versioning (`/v1`, `/v2`)
* OpenAPI documentation
* Webhooks (transaction updates, listing status changes)
* Audit logs for API calls
* Sandbox mode

**Key data entities**

* ApiClient, ApiKey, ApiScope, ApiUsageLog, WebhookEndpoint, WebhookEvent, RateLimitBucket

---

## What must change in the platform design (so this works cleanly)

### 1) You now need “Workflow Engines”

Because permits, KYC, USSD, and marketplace bookings are **process-heavy**, you need standardized workflow primitives:

* Status history tables
* SLA timers
* Event logs + webhooks
* Background jobs (cron + queue)

### 2) You must add an “Integration Layer”

These modules depend on external providers:

* KYC provider
* USSD aggregator
* District Assembly workflows (manual or API)
* Push notifications

Design as:

* `/integrations/*` service layer in code
* provider-agnostic interfaces
* provider-specific adapters

### 3) You should introduce Multi-Tenancy now (if Developer Platform is active)

If you truly mean “developer platform” (partners/third parties), add:

* `tenant_id` to most core tables
* row-level access constraints
* tenant-level config (fees, assembly templates, USSD menus)

If you don’t want multi-tenant yet, limit the “developer platform” to:

* read-only APIs + strict scopes
* no partner write access until Phase 2

---

## Immediate updates I recommend to your PRD v1.1

To reflect “these are active,” add these sections:

1. **Functional Requirements**

* Add full sections for:

  * Professional Marketplace
  * Building Permit Processing
  * KYC (Ghana Card)
  * Mobile Apps
  * USSD
  * Developer Platform (API keys, rate limiting, webhooks)

2. **Dependencies & Integrations**

* Add:

  * USSD aggregator (Hubtel USSD / Africa’s Talking / etc.)
  * Ghana Card verification provider (or NIA integration if available via partner)
  * Assembly workflow (manual bridge + later API)

3. **Roadmap**

* Replace Phase 1/2/3 with **streams running in parallel**, because mobile + USSD + API must ship alongside core APIs.

---


Below is a **complete RBAC permissions matrix** for Buy Ghana Lands, covering **all active modules** (core + Professional Marketplace + Permits + KYC + Mobile + USSD + Public API). It is written so you can directly translate it into: `roles`, `permissions`, `role_permissions`, and `policy checks` in code.

---

## 1) Roles (System + User + Institutional)

### Platform Roles (primary)

* **GUEST** (not logged in)
* **BUYER**
* **SELLER**
* **AGENT** (seller-like privileges + portfolio scale)
* **PROFESSIONAL** (service provider)
* **SUPPORT** (customer service ops)
* **COMPLIANCE** (KYC, AML, risk)
* **FINANCE** (payments/payouts/reconciliation)
* **MODERATOR** (listing moderation, content safety)
* **ADMIN** (full platform control)
* **SUPER_ADMIN** (infrastructure/security; minimal users)

### Institutional Roles (optional but recommended if permits are “active”)

* **ASSEMBLY_REVIEWER** (District Assembly staff)
* **LANDS_COMMISSION_REVIEWER** (verification partner)

> Implementation note: One user can hold multiple roles. RBAC checks should be **union-of-permissions** with “deny overrides” for suspensions.

---

## 2) Permission Design Pattern (how to implement cleanly)

Use permissions as:
`<module>:<resource>:<action>`

Examples:

* `listing:manage:create`
* `transaction:status:update`
* `kyc:request:create`
* `api:key:rotate`

Also define **scopes**:

* **OWN** (only resources the user owns)
* **ASSIGNED** (resources assigned to them)
* **ANY** (all resources)

---

## 3) RBAC Matrix by Module (Actions + Role Access)

Legend:

* ✅ Allowed (with stated scope)
* ⛔ Not allowed
* ⚠️ Allowed with conditions (noted)
* 🛡️ Admin-only / restricted

---

# A) Authentication & User Accounts

| Action                    | GUEST | BUYER | SELLER | AGENT | PROFESSIONAL |               SUPPORT |                 COMPLIANCE |                 FINANCE | MODERATOR | ADMIN | SUPER_ADMIN |
| ------------------------- | ----: | ----: | -----: | ----: | -----------: | --------------------: | -------------------------: | ----------------------: | --------: | ----: | ----------: |
| Register account          |     ✅ |     ⛔ |      ⛔ |     ⛔ |            ⛔ |                     ⛔ |                          ⛔ |                       ⛔ |         ⛔ |     ⛔ |           ⛔ |
| Login / Logout            |     ✅ |     ✅ |      ✅ |     ✅ |            ✅ |                     ✅ |                          ✅ |                       ✅ |         ✅ |     ✅ |           ✅ |
| OTP verify phone          |     ✅ |     ✅ |      ✅ |     ✅ |            ✅ |                     ✅ |                          ✅ |                       ✅ |         ✅ |     ✅ |           ✅ |
| Password reset            |     ✅ |     ✅ |      ✅ |     ✅ |            ✅ |                     ✅ |                          ✅ |                       ✅ |         ✅ |     ✅ |           ✅ |
| View own profile          |     ⛔ | ✅ OWN |  ✅ OWN | ✅ OWN |        ✅ OWN |                 ✅ OWN |                      ✅ OWN |                   ✅ OWN |     ✅ OWN | ✅ ANY |       ✅ ANY |
| Update own profile        |     ⛔ | ✅ OWN |  ✅ OWN | ✅ OWN |        ✅ OWN |                 ✅ OWN | ⚠️ OWN (restricted fields) |                   ✅ OWN |     ✅ OWN | ✅ ANY |       ✅ ANY |
| Suspend user              |     ⛔ |     ⛔ |      ⛔ |     ⛔ |            ⛔ | ⚠️ ANY (request only) |         ⚠️ ANY (recommend) | ⚠️ ANY (financial hold) |     ✅ ANY | ✅ ANY |       ✅ ANY |
| Delete/deactivate account |     ⛔ | ✅ OWN |  ✅ OWN | ✅ OWN |        ✅ OWN |                     ⛔ |                          ⛔ |                       ⛔ |         ⛔ | ✅ ANY |       ✅ ANY |

Conditions:

* Compliance can **place KYC hold**; Finance can **place payout hold**; Moderator can suspend for safety; Admin finalizes.

---

# B) Listings (Create / Edit / Publish / Versioning)

| Action                             | GUEST | BUYER |                       SELLER |                        AGENT | PROFESSIONAL |                 SUPPORT |               COMPLIANCE |              FINANCE | MODERATOR | ADMIN | SUPER_ADMIN |
| ---------------------------------- | ----: | ----: | ---------------------------: | ---------------------------: | -----------: | ----------------------: | -----------------------: | -------------------: | --------: | ----: | ----------: |
| View listing (public fields)       |     ✅ |     ✅ |                            ✅ |                            ✅ |            ✅ |                       ✅ |                        ✅ |                    ✅ |         ✅ |     ✅ |           ✅ |
| Create listing                     |     ⛔ |     ⛔ |                        ✅ OWN |                        ✅ OWN |            ⛔ |                       ⛔ |                        ⛔ |                    ⛔ |         ⛔ | ✅ ANY |       ✅ ANY |
| Edit draft listing                 |     ⛔ |     ⛔ |                        ✅ OWN |                        ✅ OWN |            ⛔ |                       ⛔ |                        ⛔ |                    ⛔ |         ⛔ | ✅ ANY |       ✅ ANY |
| Edit published listing             |     ⛔ |     ⛔ | ⚠️ OWN (creates new version) | ⚠️ OWN (creates new version) |            ⛔ |                       ⛔ |                        ⛔ |                    ⛔ |         ⛔ | ✅ ANY |       ✅ ANY |
| Submit listing for review          |     ⛔ |     ⛔ |                        ✅ OWN |                        ✅ OWN |            ⛔ |                       ⛔ |                        ⛔ |                    ⛔ |         ⛔ | ✅ ANY |       ✅ ANY |
| Approve listing publish            |     ⛔ |     ⛔ |                            ⛔ |                            ⛔ |            ⛔ |                       ⛔ | ⚠️ ANY (compliance gate) |                    ⛔ |     ✅ ANY | ✅ ANY |       ✅ ANY |
| Reject listing                     |     ⛔ |     ⛔ |                            ⛔ |                            ⛔ |            ⛔ |                       ⛔ |            ⚠️ ANY (risk) |                    ⛔ |     ✅ ANY | ✅ ANY |       ✅ ANY |
| Suspend listing                    |     ⛔ |     ⛔ |                            ⛔ |                            ⛔ |            ⛔ |        ⚠️ ANY (request) |                    ✅ ANY | ✅ ANY (payment risk) |     ✅ ANY | ✅ ANY |       ✅ ANY |
| Mark listing sold                  |     ⛔ |     ⛔ |                        ✅ OWN |                        ✅ OWN |            ⛔ |                       ⛔ |                        ⛔ |                    ⛔ |         ⛔ | ✅ ANY |       ✅ ANY |
| View listing audit/version history |     ⛔ |     ⛔ |                        ✅ OWN |                        ✅ OWN |            ⛔ | ✅ ANY (support context) |                    ✅ ANY |                ✅ ANY |     ✅ ANY | ✅ ANY |       ✅ ANY |

Conditions:

* Seller must meet verification tier rules to publish (Tier 1 minimum).
* Compliance may block publish if KYC required.

---

# C) Documents & Evidence Vault (Access Control)

| Action                                 | GUEST |                BUYER |               SELLER |                AGENT |                     PROFESSIONAL |                SUPPORT | COMPLIANCE |                FINANCE | MODERATOR | ADMIN | SUPER_ADMIN |
| -------------------------------------- | ----: | -------------------: | -------------------: | -------------------: | -------------------------------: | ---------------------: | ---------: | ---------------------: | --------: | ----: | ----------: |
| Upload listing documents               |     ⛔ |                    ⛔ |                ✅ OWN |                ✅ OWN |                                ⛔ |                      ⛔ |          ⛔ |                      ⛔ |         ⛔ | ✅ ANY |       ✅ ANY |
| View redacted listing docs (pre-offer) |     ⛔ |                    ✅ |                ✅ OWN |                ✅ OWN |                                ✅ |                      ✅ |          ✅ |                      ✅ |         ✅ |     ✅ |           ✅ |
| View full listing docs (pre-offer)     |     ⛔ |                    ⛔ |                ✅ OWN |                ✅ OWN |                                ⛔ |    ⚠️ ANY (case-based) |      ✅ ANY | ✅ ANY (financial risk) |     ✅ ANY | ✅ ANY |       ✅ ANY |
| View full docs in a transaction        |     ⛔ |              ✅ PARTY |              ✅ PARTY |              ✅ PARTY |           ✅ ASSIGNED (if booked) | ✅ ANY (support ticket) |      ✅ ANY |                  ✅ ANY |     ✅ ANY | ✅ ANY |       ✅ ANY |
| Download docs                          |     ⛔ |   ✅ PARTY / redacted |        ✅ OWN / PARTY |        ✅ OWN / PARTY |                       ✅ ASSIGNED |                  ✅ ANY |      ✅ ANY |                  ✅ ANY |     ✅ ANY | ✅ ANY |       ✅ ANY |
| View document access logs              |     ⛔ |                    ⛔ |                ✅ OWN |                ✅ OWN |                                ⛔ |                  ✅ ANY |      ✅ ANY |                  ✅ ANY |     ✅ ANY | ✅ ANY |       ✅ ANY |
| Delete document                        |     ⛔ | ⚠️ OWN (only drafts) | ⚠️ OWN (drafts only) | ⚠️ OWN (drafts only) | ⚠️ OWN (draft deliverables only) |                      ⛔ |          ⛔ |                      ⛔ |     ✅ ANY | ✅ ANY |       ✅ ANY |

Key policy: **Documents are private by default**, and full docs only visible to **transaction parties** or **assigned professionals**.

---

# D) Search, Favorites, Saved Searches, Alerts

| Action                    | GUEST | BUYER | SELLER | AGENT | PROFESSIONAL | SUPPORT | COMPLIANCE | FINANCE | MODERATOR | ADMIN | SUPER_ADMIN |
| ------------------------- | ----: | ----: | -----: | ----: | -----------: | ------: | ---------: | ------: | --------: | ----: | ----------: |
| Search listings           |     ✅ |     ✅ |      ✅ |     ✅ |            ✅ |       ✅ |          ✅ |       ✅ |         ✅ |     ✅ |           ✅ |
| Map draw-area search      |     ✅ |     ✅ |      ✅ |     ✅ |            ✅ |       ✅ |          ✅ |       ✅ |         ✅ |     ✅ |           ✅ |
| Save listing to favorites |     ⛔ | ✅ OWN |  ✅ OWN | ✅ OWN |        ✅ OWN |   ✅ OWN |      ✅ OWN |   ✅ OWN |     ✅ OWN | ✅ ANY |       ✅ ANY |
| Save search criteria      |     ⛔ | ✅ OWN |  ✅ OWN | ✅ OWN |        ✅ OWN |   ✅ OWN |      ✅ OWN |   ✅ OWN |     ✅ OWN | ✅ ANY |       ✅ ANY |
| Receive listing alerts    |     ⛔ | ✅ OWN |  ✅ OWN | ✅ OWN |        ✅ OWN |   ✅ OWN |      ✅ OWN |   ✅ OWN |     ✅ OWN | ✅ ANY |       ✅ ANY |

---

# E) Messaging & Communication

| Action                               | GUEST |          BUYER | SELLER | AGENT | PROFESSIONAL |               SUPPORT |          COMPLIANCE |             FINANCE |          MODERATOR | ADMIN | SUPER_ADMIN |
| ------------------------------------ | ----: | -------------: | -----: | ----: | -----------: | --------------------: | ------------------: | ------------------: | -----------------: | ----: | ----------: |
| Start conversation (listing inquiry) |     ⛔ |              ✅ |      ✅ |     ✅ |            ✅ |                     ✅ |                   ✅ |                   ✅ |                  ✅ |     ✅ |           ✅ |
| Send message                         |     ⛔ |          ✅ OWN |  ✅ OWN | ✅ OWN |        ✅ OWN | ✅ ANY (ticket-linked) | ✅ ANY (case-linked) | ✅ ANY (case-linked) | ✅ ANY (moderation) | ✅ ANY |       ✅ ANY |
| Send attachments                     |     ⛔ | ✅ OWN (policy) |  ✅ OWN | ✅ OWN |        ✅ OWN |                 ✅ ANY |               ✅ ANY |               ✅ ANY |              ✅ ANY | ✅ ANY |       ✅ ANY |
| Moderate messages (take down)        |     ⛔ |              ⛔ |      ⛔ |     ⛔ |            ⛔ |         ⚠️ ANY (flag) |               ✅ ANY |                   ⛔ |              ✅ ANY | ✅ ANY |       ✅ ANY |

---

# F) Offers & Negotiation

| Action                | GUEST |         BUYER |        SELLER |         AGENT | PROFESSIONAL |              SUPPORT |                   COMPLIANCE | FINANCE | MODERATOR | ADMIN | SUPER_ADMIN |
| --------------------- | ----: | ------------: | ------------: | ------------: | -----------: | -------------------: | ---------------------------: | ------: | --------: | ----: | ----------: |
| Make offer            |     ⛔ |         ✅ OWN |             ⛔ |             ⛔ |            ⛔ |                    ⛔ |    ⚠️ ANY (limit/hard block) |       ⛔ |         ⛔ | ✅ ANY |       ✅ ANY |
| Counter offer         |     ⛔ |       ✅ PARTY |       ✅ PARTY |       ✅ PARTY |            ⛔ |                    ⛔ |                            ⛔ |       ⛔ |         ⛔ | ✅ ANY |       ✅ ANY |
| Accept offer          |     ⛔ |       ✅ PARTY |       ✅ PARTY |       ✅ PARTY |            ⛔ |                    ⛔ | ⚠️ ANY (block if KYC needed) |       ⛔ |         ⛔ | ✅ ANY |       ✅ ANY |
| Cancel/withdraw offer |     ⛔ |         ✅ OWN |         ✅ OWN |         ✅ OWN |            ⛔ | ✅ ANY (support case) |                        ✅ ANY |   ✅ ANY |     ✅ ANY | ✅ ANY |       ✅ ANY |
| View offer history    |     ⛔ | ✅ OWN / PARTY | ✅ OWN / PARTY | ✅ OWN / PARTY |            ⛔ |                ✅ ANY |                        ✅ ANY |   ✅ ANY |     ✅ ANY | ✅ ANY |       ✅ ANY |

---

# G) Transactions (State Machine, Workspaces)

| Action                                   | GUEST |                    BUYER |                   SELLER |    AGENT | PROFESSIONAL |                SUPPORT |     COMPLIANCE |               FINANCE | MODERATOR | ADMIN | SUPER_ADMIN |
| ---------------------------------------- | ----: | -----------------------: | -----------------------: | -------: | -----------: | ---------------------: | -------------: | --------------------: | --------: | ----: | ----------: |
| Create transaction (from accepted offer) |     ⛔ |                  ✅ PARTY |                  ✅ PARTY |  ✅ PARTY |            ⛔ |                      ⛔ |              ⛔ |                     ⛔ |         ⛔ | ✅ ANY |       ✅ ANY |
| View transaction workspace               |     ⛔ |                  ✅ PARTY |                  ✅ PARTY |  ✅ PARTY |   ✅ ASSIGNED |         ✅ ANY (ticket) |          ✅ ANY |                 ✅ ANY |     ✅ ANY | ✅ ANY |       ✅ ANY |
| Update transaction status                |     ⛔ | ⚠️ PARTY (limited steps) | ⚠️ PARTY (limited steps) | ⚠️ PARTY |            ⛔ | ⚠️ ANY (support notes) | ⚠️ ANY (holds) | ⚠️ ANY (payout steps) |         ⛔ | ✅ ANY |       ✅ ANY |
| Upload transaction docs                  |     ⛔ |                  ✅ PARTY |                  ✅ PARTY |  ✅ PARTY |   ✅ ASSIGNED |                  ✅ ANY |          ✅ ANY |                 ✅ ANY |     ✅ ANY | ✅ ANY |       ✅ ANY |
| Cancel transaction                       |     ⛔ |      ⚠️ PARTY (pre-fund) |      ⚠️ PARTY (pre-fund) | ⚠️ PARTY |            ⛔ |   ✅ ANY (support case) |          ✅ ANY |                 ✅ ANY |     ✅ ANY | ✅ ANY |       ✅ ANY |

Key restriction: **Status transitions must be validated server-side**; parties can only trigger specific transitions (e.g., buyer can “confirm satisfaction”, seller can “mark docs delivered”, etc.).

---

# H) Payments, Payouts, Refunds, Ledger

| Action                   | GUEST |                    BUYER |           SELLER |            AGENT |     PROFESSIONAL |         SUPPORT |         COMPLIANCE |             FINANCE | MODERATOR |     ADMIN | SUPER_ADMIN |
| ------------------------ | ----: | -----------------------: | ---------------: | ---------------: | ---------------: | --------------: | -----------------: | ------------------: | --------: | --------: | ----------: |
| Pay listing fee          |     ⛔ |                        ⛔ |            ✅ OWN |            ✅ OWN |                ⛔ |               ⛔ |                  ⛔ |                   ⛔ |         ⛔ |     ✅ ANY |       ✅ ANY |
| Fund transaction         |     ⛔ |                  ✅ PARTY |                ⛔ |                ⛔ |                ⛔ |               ⛔ | ⚠️ ANY (AML block) | ✅ ANY (verify refs) |         ⛔ |     ✅ ANY |       ✅ ANY |
| View payment history     |     ⛔ |                    ✅ OWN |            ✅ OWN |            ✅ OWN |            ✅ OWN |  ✅ ANY (ticket) |              ✅ ANY |               ✅ ANY |     ✅ ANY |     ✅ ANY |       ✅ ANY |
| Initiate payout          |     ⛔ |                        ⛔ | ⚠️ OWN (request) | ⚠️ OWN (request) | ⚠️ OWN (request) |               ⛔ |      ⚠️ ANY (hold) |               ✅ ANY |         ⛔ |     ✅ ANY |       ✅ ANY |
| Execute payout           |     ⛔ |                        ⛔ |                ⛔ |                ⛔ |                ⛔ |               ⛔ |                  ⛔ |           ✅ ANY 🛡️ |         ⛔ | ✅ ANY 🛡️ |   ✅ ANY 🛡️ |
| Initiate refund          |     ⛔ | ⚠️ PARTY (dispute-based) |         ⚠️ PARTY |         ⚠️ PARTY |                ⛔ | ✅ ANY (support) |              ✅ ANY |           ✅ ANY 🛡️ |         ⛔ | ✅ ANY 🛡️ |   ✅ ANY 🛡️ |
| Reconcile PSP references |     ⛔ |                        ⛔ |                ⛔ |                ⛔ |                ⛔ |               ⛔ |                  ⛔ |           ✅ ANY 🛡️ |         ⛔ |     ✅ ANY |       ✅ ANY |

---

# I) Disputes & Resolution

| Action             | GUEST |   BUYER |  SELLER |   AGENT |                  PROFESSIONAL |              SUPPORT |         COMPLIANCE |                        FINANCE | MODERATOR |     ADMIN | SUPER_ADMIN |
| ------------------ | ----: | ------: | ------: | ------: | ----------------------------: | -------------------: | -----------------: | -----------------------------: | --------: | --------: | ----------: |
| Raise dispute      |     ⛔ | ✅ PARTY | ✅ PARTY | ✅ PARTY | ✅ ASSIGNED (service disputes) | ✅ ANY (ticket-based) |              ✅ ANY |                          ✅ ANY |         ⛔ |     ✅ ANY |       ✅ ANY |
| Upload evidence    |     ⛔ | ✅ PARTY | ✅ PARTY | ✅ PARTY |                    ✅ ASSIGNED |                ✅ ANY |              ✅ ANY |                          ✅ ANY |     ✅ ANY |     ✅ ANY |       ✅ ANY |
| Respond to dispute |     ⛔ | ✅ PARTY | ✅ PARTY | ✅ PARTY |                    ✅ ASSIGNED |                ✅ ANY |              ✅ ANY |                          ✅ ANY |         ⛔ |     ✅ ANY |       ✅ ANY |
| Resolve dispute    |     ⛔ |       ⛔ |       ⛔ |       ⛔ |                             ⛔ |   ⚠️ ANY (recommend) | ⚠️ ANY (recommend) | ⚠️ ANY (financial constraints) |         ⛔ | ✅ ANY 🛡️ |   ✅ ANY 🛡️ |

---

# J) Trust, Safety & Fraud Management

| Action                        | GUEST | BUYER | SELLER | AGENT | PROFESSIONAL |            SUPPORT | COMPLIANCE |   FINANCE | MODERATOR |     ADMIN | SUPER_ADMIN |
| ----------------------------- | ----: | ----: | -----: | ----: | -----------: | -----------------: | ---------: | --------: | --------: | --------: | ----------: |
| Report listing/user           |     ✅ |     ✅ |      ✅ |     ✅ |            ✅ |                  ✅ |          ✅ |         ✅ |         ✅ |         ✅ |           ✅ |
| View fraud cases              |     ⛔ |     ⛔ |      ⛔ |     ⛔ |            ⛔ |              ✅ ANY |  ✅ ANY 🛡️ | ✅ ANY 🛡️ |     ✅ ANY |     ✅ ANY |       ✅ ANY |
| Create fraud case             |     ⛔ |     ⛔ |      ⛔ |     ⛔ |            ⛔ |              ✅ ANY |      ✅ ANY |     ✅ ANY |     ✅ ANY |     ✅ ANY |       ✅ ANY |
| Suspend listing/user (safety) |     ⛔ |     ⛔ |      ⛔ |     ⛔ |            ⛔ |   ⚠️ ANY (request) |      ✅ ANY |     ✅ ANY | ✅ ANY 🛡️ | ✅ ANY 🛡️ |   ✅ ANY 🛡️ |
| Resolve fraud case            |     ⛔ |     ⛔ |      ⛔ |     ⛔ |            ⛔ | ⚠️ ANY (recommend) |  ✅ ANY 🛡️ | ✅ ANY 🛡️ |     ✅ ANY | ✅ ANY 🛡️ |   ✅ ANY 🛡️ |

---

# K) Verification (Listing Ownership / Documents)

| Action                     | GUEST |                 BUYER | SELLER | AGENT |        PROFESSIONAL |        SUPPORT | COMPLIANCE | FINANCE | MODERATOR |     ADMIN | SUPER_ADMIN |
| -------------------------- | ----: | --------------------: | -----: | ----: | ------------------: | -------------: | ---------: | ------: | --------: | --------: | ----------: |
| Request verification       |     ⛔ | ⚠️ OWN (paid request) |  ✅ OWN | ✅ OWN | ✅ OWN (for license) | ✅ ANY (assist) |      ✅ ANY |       ⛔ |         ⛔ |     ✅ ANY |       ✅ ANY |
| Perform platform review    |     ⛔ |                     ⛔ |      ⛔ |     ⛔ |                   ⛔ |              ⛔ |  ✅ ANY 🛡️ |       ⛔ | ✅ ANY 🛡️ |     ✅ ANY |       ✅ ANY |
| Update verification status |     ⛔ |                     ⛔ |      ⛔ |     ⛔ |                   ⛔ |              ⛔ |  ✅ ANY 🛡️ |       ⛔ | ✅ ANY 🛡️ | ✅ ANY 🛡️ |   ✅ ANY 🛡️ |

Optional institutional roles:

* **LANDS_COMMISSION_REVIEWER**: can update “OFFICIAL_VERIFIED” status only (assigned scope).

---

# L) Ghana Card KYC (Identity)

| Action                | GUEST |                   BUYER | SELLER | AGENT | PROFESSIONAL |        SUPPORT | COMPLIANCE |       FINANCE | MODERATOR |     ADMIN | SUPER_ADMIN |
| --------------------- | ----: | ----------------------: | -----: | ----: | -----------: | -------------: | ---------: | ------------: | --------: | --------: | ----------: |
| Initiate KYC          |     ⛔ | ✅ OWN (threshold-based) |  ✅ OWN | ✅ OWN |        ✅ OWN | ✅ ANY (assist) |  ✅ ANY 🛡️ |             ⛔ |         ⛔ |     ✅ ANY |       ✅ ANY |
| View KYC status       |     ⛔ |                   ✅ OWN |  ✅ OWN | ✅ OWN |        ✅ OWN | ✅ ANY (ticket) |  ✅ ANY 🛡️ | ⚠️ ANY (risk) |         ⛔ |     ✅ ANY |       ✅ ANY |
| View KYC raw payload  |     ⛔ |                       ⛔ |      ⛔ |     ⛔ |            ⛔ |              ⛔ |  ✅ ANY 🛡️ |             ⛔ |         ⛔ | ✅ ANY 🛡️ |   ✅ ANY 🛡️ |
| Override KYC decision |     ⛔ |                       ⛔ |      ⛔ |     ⛔ |            ⛔ |              ⛔ |  ✅ ANY 🛡️ |             ⛔ |         ⛔ | ✅ ANY 🛡️ |   ✅ ANY 🛡️ |

---

# M) Professional Marketplace (Profiles, Services, Requests, Bookings, Reviews)

| Action                             | GUEST |                   BUYER |                  SELLER |                   AGENT |                 PROFESSIONAL |          SUPPORT |                  COMPLIANCE |              FINANCE | MODERATOR | ADMIN | SUPER_ADMIN |
| ---------------------------------- | ----: | ----------------------: | ----------------------: | ----------------------: | ---------------------------: | ---------------: | --------------------------: | -------------------: | --------: | ----: | ----------: |
| View professional directory        |     ✅ |                       ✅ |                       ✅ |                       ✅ |                            ✅ |                ✅ |                           ✅ |                    ✅ |         ✅ |     ✅ |           ✅ |
| Create/update professional profile |     ⛔ |                       ⛔ |                       ⛔ |                       ⛔ |                        ✅ OWN |   ✅ ANY (assist) |        ✅ ANY (license gate) |                    ⛔ |         ⛔ | ✅ ANY |       ✅ ANY |
| Publish services                   |     ⛔ |                       ⛔ |                       ⛔ |                       ⛔ |                        ✅ OWN |   ✅ ANY (assist) | ✅ ANY (block if unverified) |                    ⛔ |         ⛔ | ✅ ANY |       ✅ ANY |
| Create service request             |     ⛔ |                   ✅ OWN |                   ✅ OWN |                   ✅ OWN |                            ⛔ |            ✅ ANY |                           ⛔ |                    ⛔ |         ⛔ | ✅ ANY |       ✅ ANY |
| Accept/decline request             |     ⛔ |                       ⛔ |                       ⛔ |                       ⛔ |               ✅ ASSIGNED/OWN |            ✅ ANY |                           ⛔ |                    ⛔ |         ⛔ | ✅ ANY |       ✅ ANY |
| Manage booking workflow            |     ⛔ |                 ✅ PARTY |                 ✅ PARTY |                 ✅ PARTY |                      ✅ PARTY |            ✅ ANY |                           ⛔ | ⚠️ ANY (payout gate) |         ⛔ | ✅ ANY |       ✅ ANY |
| Leave review                       |     ⛔ | ✅ OWN (post-completion) | ✅ OWN (post-completion) | ✅ OWN (post-completion) | ✅ OWN (peer review optional) | ✅ ANY (moderate) |                           ⛔ |                    ⛔ |     ✅ ANY | ✅ ANY |       ✅ ANY |

---

# N) Building Permits (Applications, Review, Status)

| Action                          | GUEST | BUYER | SELLER | AGENT |                       PROFESSIONAL |                 SUPPORT |                COMPLIANCE | FINANCE | MODERATOR |                    ADMIN |              SUPER_ADMIN |
| ------------------------------- | ----: | ----: | -----: | ----: | ---------------------------------: | ----------------------: | ------------------------: | ------: | --------: | -----------------------: | -----------------------: |
| Create permit application       |     ⛔ | ✅ OWN |  ✅ OWN | ✅ OWN | ✅ ASSIGNED (on behalf, if allowed) |          ✅ ANY (assist) |                         ⛔ |       ⛔ |         ⛔ |                    ✅ ANY |                    ✅ ANY |
| Submit permit application       |     ⛔ | ✅ OWN |  ✅ OWN | ✅ OWN |                         ✅ ASSIGNED |                   ✅ ANY |                         ⛔ |       ⛔ |         ⛔ |                    ✅ ANY |                    ✅ ANY |
| View permit application         |     ⛔ | ✅ OWN |  ✅ OWN | ✅ OWN |                         ✅ ASSIGNED |                   ✅ ANY |                     ✅ ANY |   ✅ ANY |         ⛔ |                    ✅ ANY |                    ✅ ANY |
| Update permit status (internal) |     ⛔ |     ⛔ |      ⛔ |     ⛔ |                                  ⛔ | ⚠️ ANY (ticket updates) | ✅ ANY (compliance checks) |       ⛔ |         ⛔ |                ✅ ANY 🛡️ |                ✅ ANY 🛡️ |
| Update permit status (assembly) |     ⛔ |     ⛔ |      ⛔ |     ⛔ |                                  ⛔ |                       ⛔ |                         ⛔ |       ⛔ |         ⛔ | ⚠️ via ASSEMBLY_REVIEWER | ⚠️ via ASSEMBLY_REVIEWER |

Institution role:

* **ASSEMBLY_REVIEWER** can update status for assigned applications only.

---

# O) Mobile Devices & Push Notifications

| Action                | GUEST | BUYER | SELLER | AGENT | PROFESSIONAL | SUPPORT | COMPLIANCE | FINANCE | MODERATOR | ADMIN | SUPER_ADMIN |
| --------------------- | ----: | ----: | -----: | ----: | -----------: | ------: | ---------: | ------: | --------: | ----: | ----------: |
| Register device token |     ⛔ | ✅ OWN |  ✅ OWN | ✅ OWN |        ✅ OWN |   ✅ OWN |      ✅ OWN |   ✅ OWN |     ✅ OWN | ✅ ANY |       ✅ ANY |
| Remove device token   |     ⛔ | ✅ OWN |  ✅ OWN | ✅ OWN |        ✅ OWN |   ✅ OWN |      ✅ OWN |   ✅ OWN |     ✅ OWN | ✅ ANY |       ✅ ANY |

---

# P) USSD Channel

| Action                           | GUEST | BUYER | SELLER | AGENT | PROFESSIONAL |        SUPPORT | COMPLIANCE | FINANCE | MODERATOR | ADMIN | SUPER_ADMIN |
| -------------------------------- | ----: | ----: | -----: | ----: | -----------: | -------------: | ---------: | ------: | --------: | ----: | ----------: |
| Initiate USSD session            |     ✅ |     ✅ |      ✅ |     ✅ |            ✅ |              ✅ |          ✅ |       ✅ |         ✅ |     ✅ |           ✅ |
| Search via USSD                  |     ✅ |     ✅ |      ✅ |     ✅ |            ✅ |              ✅ |          ✅ |       ✅ |         ✅ |     ✅ |           ✅ |
| View transaction status via USSD |     ⛔ | ✅ OWN |  ✅ OWN | ✅ OWN |        ✅ OWN | ✅ ANY (assist) |      ✅ ANY |   ✅ ANY |         ⛔ | ✅ ANY |       ✅ ANY |
| Admin USSD logs access           |     ⛔ |     ⛔ |      ⛔ |     ⛔ |            ⛔ |          ✅ ANY |      ✅ ANY |   ✅ ANY |     ✅ ANY | ✅ ANY |       ✅ ANY |

---

# Q) Public API / Developer Platform

| Action                 | GUEST | BUYER |                     SELLER |                     AGENT |               PROFESSIONAL | SUPPORT |      COMPLIANCE | FINANCE | MODERATOR |     ADMIN | SUPER_ADMIN |
| ---------------------- | ----: | ----: | -------------------------: | ------------------------: | -------------------------: | ------: | --------------: | ------: | --------: | --------: | ----------: |
| Create API client      |     ⛔ |     ⛔ | ⚠️ OWN (approved partners) | ✅ OWN (approved partners) | ⚠️ OWN (approved partners) |       ⛔ | ✅ ANY (vetting) |       ⛔ |         ⛔ | ✅ ANY 🛡️ |   ✅ ANY 🛡️ |
| Create/revoke API keys |     ⛔ |     ⛔ |                     ⚠️ OWN |                     ✅ OWN |                     ⚠️ OWN |       ⛔ |    ✅ ANY (risk) |       ⛔ |         ⛔ | ✅ ANY 🛡️ |   ✅ ANY 🛡️ |
| Assign scopes          |     ⛔ |     ⛔ |                          ⛔ |                         ⛔ |                          ⛔ |       ⛔ | ✅ ANY (approve) |       ⛔ |         ⛔ | ✅ ANY 🛡️ |   ✅ ANY 🛡️ |
| View API usage logs    |     ⛔ |     ⛔ |                      ✅ OWN |                     ✅ OWN |                      ✅ OWN |       ⛔ |           ✅ ANY |   ✅ ANY |         ⛔ |     ✅ ANY |       ✅ ANY |
| Create webhooks        |     ⛔ |     ⛔ |                     ⚠️ OWN |                     ✅ OWN |                     ⚠️ OWN |       ⛔ |           ✅ ANY |       ⛔ |         ⛔ |     ✅ ANY |       ✅ ANY |
| Manage webhook events  |     ⛔ |     ⛔ |                     ⚠️ OWN |                     ✅ OWN |                     ⚠️ OWN |       ⛔ |           ✅ ANY |       ⛔ |         ⛔ |     ✅ ANY |       ✅ ANY |

Conditions:

* Developer platform should be “partner-only” initially, enforced by admin/compliance approval.

---

## 4) Cross-Cutting “Holds” and “Denies” (must implement)

These are not roles; they are **account flags** that override permissions:

### Global Deny Flags

* `isSuspended = true` → blocks all write actions (except support contact)
* `kycHold = true` → blocks: publish listing, accept offer, fund transaction, payout
* `payoutHold = true` → blocks: payouts/withdrawals
* `fraudUnderInvestigation = true` → blocks: listing publish, transaction progress beyond verification

This prevents “role escalation” from bypassing compliance.

---

## 5) Minimal Permission List (for your permissions table)

If you want to implement via `Permission` records, start with these core permissions:

* `user:manage:any`
* `listing:create:own`
* `listing:edit:own`
* `listing:publish:any`
* `listing:suspend:any`
* `document:view:redacted`
* `document:view:full:party`
* `transaction:view:party`
* `transaction:status:update:any`
* `payment:reconcile:any`
* `payout:execute:any`
* `dispute:resolve:any`
* `kyc:override:any`
* `permit:status:update:any`
* `api:key:manage:own`
* `api:scope:assign:any`
* `webhook:manage:own`
* `fraud:case:manage:any`

---


Below is the **end-to-end workflow** you should implement for Buy Ghana Lands, covering **RBAC authorization flow** (how access is decided) and the **key business workflows** across the newly-active modules.

---

## 1) RBAC Authorization Workflow (Request → Decision → Audit)

### Step 1: Identify actor and session

1. Request hits API (web/mobile/USSD/public API).
2. Resolve identity via one of:

   * **User JWT** (web/mobile)
   * **USSD MSISDN session** (mapped to User if verified)
   * **API Key** (developer platform)

### Step 2: Load authorization context

Fetch:

* `user.roles[]`
* `user.flags` (suspended, kycHold, payoutHold, fraudUnderInvestigation)
* Resource ownership/relationship (OWN / PARTY / ASSIGNED / ANY)
* Optional: tenant context (if enabled)

### Step 3: Evaluate hard “deny overrides” first (non-negotiable)

If any is true, block relevant actions even if role permits:

* `isSuspended` → block all writes (except support contact)
* `kycHold` → block: publish, accept offer, fund transaction, payout, permit submit (if you want)
* `payoutHold` → block payouts
* `fraudUnderInvestigation` → block publish + transaction progression

### Step 4: RBAC permission check

Evaluate:

* Does role OR explicit permission allow `module:resource:action`?
* Is the scope valid? (OWN / PARTY / ASSIGNED / ANY)
* Are required prerequisites satisfied? (e.g., phone verified, tier met)

### Step 5: Policy-based constraints (business rules)

Examples:

* Seller cannot publish if Tier 1 KYC not complete
* Buyer cannot fund transaction until offer accepted
* Professional cannot accept booking if licenseStatus is REJECTED

### Step 6: Decision + audit log

* Allow → continue
* Deny → return structured error (`403` + reason code)
* Always write an **audit log** for sensitive operations (payments, status changes, KYC decisions, admin actions).

---

## 2) Core Marketplace Workflow (Search → Offer → Transaction Protection → Completion)

### A) Buyer discovery

1. Buyer searches listings (map + filters).
2. Buyer views listing details (redacted docs only).
3. Buyer messages seller/agent.

### B) Offer & negotiation

1. Buyer makes offer.
2. Seller/agent accepts or counters.
3. Once accepted, the system:

   * Locks price
   * Creates `Transaction` in `CREATED` state
   * Creates payment request for transaction funding

### C) Transaction protection (escrow-style milestones)

1. Buyer funds transaction → `FUNDED`
2. Verification period starts → `VERIFICATION_PERIOD`
3. Buyer confirms satisfaction:

   * If no dispute → `READY_TO_RELEASE`
   * If dispute → `DISPUTED`
4. Admin/Finance releases funds → `RELEASED` (payout executed)
5. Transaction closes → `CLOSED`

Key enforcement: **Only valid state transitions are allowed**.

---

## 3) KYC (Ghana Card) Workflow (Step-up Identity)

### A) Trigger rules

KYC required when:

* Seller wants to publish (Tier 1 minimum)
* Buyer exceeds threshold (e.g., > GH₵100k)
* High-risk flag raised
* Professional registers to offer services

### B) Process

1. User initiates KYC → `KycRequest(INITIATED)`
2. Provider call → `PENDING`
3. Provider callback/webhook updates:

   * `PASSED` → unlock gated actions
   * `FAILED/RETRY` → enforce holds + allow retry
   * `MANUAL_REVIEW` → Compliance queue
4. Compliance decision recorded (override allowed only to Compliance/Admin)
5. Audit log created (mandatory)

---

## 4) Professional Services Marketplace Workflow (Request → Booking → Deliverables → Payment)

### A) Request

1. Buyer/seller posts `ServiceRequest(OPEN)` linked to listing/transaction.
2. Professional receives and responds:

   * Accept → `ACCEPTED`
   * Decline → `DECLINED`

### B) Booking

1. `Booking(REQUESTED)` created on acceptance
2. Schedule confirmed → `CONFIRMED`
3. Work begins → `IN_PROGRESS`

### C) Deliverables + completion

1. Professional uploads deliverables (reports/drawings) as documents linked to booking
2. Mark delivered → `DELIVERED`
3. Client approves → `COMPLETED` (or disputes)

### D) Payment handling

* If you require “upfront” payment: capture before `IN_PROGRESS`
* If milestone-based: release after `COMPLETED`
* Finance executes payouts; disputes freeze payouts.

---

## 5) Building Permit Workflow (Application → Review → Queries → Approval)

### A) Application creation

1. User creates `PermitApplication(DRAFT)`
2. Upload required documents via `PermitDocument`
3. Pay permit fees (if required) → `PermitFeePayment`

### B) Submission & processing

1. Submit → `SUBMITTED`
2. Admin or Assembly reviewer sets:

   * `UNDER_REVIEW`
   * `QUERY_RAISED` (with `PermitQuery`)
3. Applicant responds → `RESUBMITTED`
4. Decision:

   * `APPROVED` (attach permit certificate document)
   * `REJECTED` (record reasons)
5. Status history records every change.

Note: If Assemblies lack APIs, treat as **manual bridge** with internal operators.

---

## 6) USSD Workflow (Session → Menus → Actions)

### A) Session management

1. Aggregator calls `/api/ussd` with `sessionId + msisdn + text`
2. Create/update `UssdSession(state, currentStep)`
3. Respond with menu text within 3–5 seconds.

### B) Supported USSD actions

* Search by region/district/price
* View listing summaries (limit results)
* Track transaction status (only if phone linked to account)
* Create support ticket request

### C) Security

* Sensitive actions require OTP verification (link MSISDN ↔ user).

---

## 7) Public API / Developer Platform Workflow

### A) Partner onboarding

1. Admin/Compliance approves partner
2. Partner creates `ApiClient`
3. Admin assigns allowed scopes
4. Partner generates API key (store hash only)

### B) Request processing

1. API request includes key
2. Validate key hash + status
3. Check scope for endpoint
4. Rate-limit
5. Log request (`ApiUsageLog`)
6. Return response

### C) Webhooks

1. Event occurs (e.g., transaction status change)
2. Create `WebhookDelivery(PENDING)`
3. Worker/cron attempts delivery
4. Retry with backoff; mark `DEAD` after threshold

---

Below are the **connected user workflows** from **Guest → Buyer/Seller/Agent/Professional → Transaction → Verification → Permits → Construction Docs**, showing how each flow hands off to the next. I’m writing this as a **single system journey map** with clear “connection points” (the objects that link workflows: Listing, Offer, Transaction, ServiceRequest, Booking, PermitApplication, Documents).

---

# 0) Guest Entry Workflow (Guest → Account)

## 0.1 Guest explores

**Guest can do:**

* Browse landing page + map
* Search/filter listings
* View listing details (limited fields)
* View professional directory (public)
* Read guides/FAQs

**Triggers to convert from Guest:**

* “Save listing”
* “Message seller”
* “Make offer”
* “List your land”
* “Request verification”
* “Apply for permit”
* “Request site plan / survey”
* “Request architect drawings”
* “Track transaction”

**Connection point created:** none yet
**Next workflow:** **Account creation + role selection**

---

# 1) Guest → Buyer or Seller (Onboarding + Role Assignment)

## 1.1 Create account (common)

1. Guest clicks **Sign Up**
2. Enters phone/email → OTP verification
3. Creates profile

**Connection point:** `User`

### 1.2 Choose path (role)

User chooses one or more:

* **Buyer**
* **Seller**
* **Agent**
* **Professional** (Surveyor/Lawyer/Architect/etc.)

> Users can hold multiple roles. The UI should present it as “What do you want to do today?”

---

## 1A) Buyer Workflow (Search → Inquiry → Offer → Transaction)

1. Buyer searches listings (map/list)
2. Opens listing → reviews photos + redacted docs
3. Clicks **Message seller/agent**
4. Clicks **Make Offer**
5. Negotiation (counter/accept)
6. Offer accepted → system creates **Transaction**

**Connection points created:**

* `Conversation` (optional)
* `Offer`
* `Transaction`

**Next workflows that connect here:**

* Verification workflow (ownership/doc checks)
* Professional services workflow (survey, legal, etc.)
* Payments workflow (funding)
* Permits workflow (if buyer wants to build)

---

## 1B) Seller Workflow (Create Listing → Publish → Offers → Transaction)

1. Seller clicks **List your land**
2. Completes listing wizard (location, polygon, media, docs)
3. Submits for review
4. Moderator approves → listing published
5. Receives inquiries/offers
6. Accept offer → **Transaction** created
7. Seller uploads additional transaction docs as requested

**Connection points created:**

* `Listing`
* `Documents`
* `Offer`
* `Transaction`

**Next workflows that connect here:**

* Verification workflow (to increase trust)
* Professional services workflow (site plan/title/legal)
* Payments + payout workflow

---

# 2) “Get an Agent to Work on Permits / Site Plan / Land Title Documentation”

This is a **Professional Marketplace** flow. An “Agent” here can be:

* A platform **AGENT role** (real estate agent)
* Or a **Professional** (surveyor/lawyer) depending on service.

## 2.1 Entry points (how user initiates)

From anywhere:

* Listing page → “Need help verifying this land?”
* Transaction page → “Hire a lawyer/surveyor”
* Dashboard → “Request a site plan / title documentation / permit support”
* Permit hub → “Get an agent to handle permit end-to-end”

## 2.2 Service request (Agent-led)

1. User chooses a service:

   * **Site Plan / Survey**
   * **Title Search / Documentation**
   * **Permit Processing**
   * **Due diligence + family land documentation**

2. System creates `ServiceRequest(OPEN)` linked to:

   * `listingId` (if before purchase), or
   * `transactionId` (if after offer accepted)

3. Matching:

   * User chooses a specific agent/professional, OR
   * Platform suggests based on region + rating + availability

4. Agent accepts → system creates `Booking`

**Connection points created:**

* `ServiceRequest`
* `Booking`
* `Documents` (deliverables)

## 2.3 Deliverables

Depending on service type:

* Surveyor uploads **site plan** / boundary report
* Lawyer uploads **title search report** / conveyancing docs
* Agent uploads **permit submission receipt** / status updates

**Where it connects next:**

* If land purchase is ongoing → attach deliverables to `Transaction`
* If permit process is needed → create or update `PermitApplication`
* If a dispute arises → `Dispute` module

---

# 3) “Get an Architect/Draftsman to Produce Construction Documents for Permits”

This is another Professional Marketplace path, typically initiated after:

* Buyer has land (or is confident to proceed), and
* Permit workflow begins.

## 3.1 Entry points

* Permit hub → “Need drawings for permit?”
* Transaction completion → “Start building: apply for permit”
* Listing saved → “Request preliminary design + estimate”

## 3.2 Request architectural services

1. User selects:

   * **Concept design** (optional)
   * **Permit drawings (Architectural)**
   * **Structural drawings** (if needed)
   * **MEP drawings** (optional depending on assembly)

2. System creates `ServiceRequest` linked to:

   * `permitApplicationId` (recommended), or
   * `listingId`/`transactionId` if permit not yet created

3. Architect/draftsman accepts → `Booking(CONFIRMED)`

4. Architect uploads deliverables:

   * Architectural drawings PDF set
   * Schedules / notes
   * Any required forms

**Connection points created:**

* `ServiceRequest`
* `Booking`
* `Document` (deliverables)
* Optionally links to `PermitApplication`

## 3.3 Handoff to permits

Once drawings are uploaded:

* Permit module checks “required docs list”
* User can now click **Submit permit**

**Next connected workflow:** Building permit submission + review cycle

---

# 4) Building Permit Workflow (Connected End-to-End)

## 4.1 Create permit application

1. User clicks **Apply for Permit**
2. Selects District Assembly
3. Auto-checklist appears (based on assembly config)
4. Upload docs (site plan, drawings, ownership docs)
5. Pay fees (if applicable)
6. Submit → status becomes `SUBMITTED`

**Connection points created:**

* `PermitApplication`
* `PermitDocument`
* `PermitFeePayment`
* `PermitStatusHistory`

## 4.2 Review cycle (Assembly/Admin bridge)

* Under review → `UNDER_REVIEW`
* If query raised → `QUERY_RAISED` + `PermitQuery`
* User responds (uploads corrections) → `RESUBMITTED`
* Final outcome:

  * `APPROVED` (permit certificate uploaded)
  * `REJECTED` (reasons logged)

**Next connected workflow:**

* Construction phase onboarding (optional module)
* Contractor/quantity surveyor sourcing (future extension)

---

# 5) Diaspora Workflow (Remote purchase + representation)

This is essentially the Buyer workflow with extra steps:

1. Diaspora buyer selects listings
2. Requests **on-ground verification** via professional booking
3. Funds transaction after verification evidence
4. Uses milestone approvals (documents received, site visit confirmed, etc.)
5. Proceeds to permit workflow remotely (architect + agent handle)

**Connections:**

* `ServiceRequest` becomes critical for representation
* `Transaction` milestones rely on professional deliverables

---

# 6) “Etc.” — Additional Connected Workflows You Should Support

## 6.1 Land verification workflow (before purchase)

* From listing → “Request verification”
* Creates `VerificationRequest`
* Results update listing badge
* Can be attached to transaction as evidence

## 6.2 Title documentation workflow (after purchase)

* From transaction completion → “Start title documentation”
* Creates `ServiceRequest` for lawyer
* Deliverables stored in document vault
* Can be used for future resale listing (pre-filled verification)

## 6.3 Dispute workflow (any stage)

* From transaction, service booking, or permit
* Creates `Dispute`
* Freezes payouts until resolved

---

# 7) How all workflows connect (Object Graph)

This is the “spine” of your platform:

* **Guest → User**
* **User(Buyer) → Offer → Transaction**
* **User(Seller) → Listing → Offer → Transaction**
* **Transaction ↔ Documents ↔ Verification**
* **Transaction/Listing/Permit → ServiceRequest → Booking → Deliverables**
* **Deliverables → unlock PermitApplication submission**
* **PermitApplication → Approval → Permit Certificate**
* **Any of the above → Dispute → Resolution**

---

## Recommended UI Navigation (so users feel the connection)

Create a single unified area called **“My Journey”** in the dashboard with tabs:

1. **Saved Lands**
2. **Offers**
3. **Transactions**
4. **Services (Agents/Professionals)**
5. **Permits**
6. **Documents Vault**
7. **Support / Disputes**

This keeps the user from feeling like permits and professionals are “separate products.”

---

Noted. Below is a **clean, integrated extension** to the user workflows **plus** a **clear business model & subscription structure**, fully aligned with **Ghana land law**, escrow/instalments, and verification.

I have structured this so it can be dropped directly into your **PRD v1.1** and also used by **engineering + sales** without ambiguity.

---

# A. LAND POSTING STRUCTURE (FOUNDATIONAL DATA MODEL)

These attributes apply to **every land listing** and influence **search, pricing, payment plans, legal flow, and verification**.

---

## A1. Land Use Category (Primary Classification)

**Used for:** search, permits, valuation logic, and professional matching.

| Category      | Description                   | Permit Sensitivity |
| ------------- | ----------------------------- | ------------------ |
| Residential   | Housing (single/multi-family) | Medium             |
| Commercial    | Shops, offices, hotels        | High               |
| Industrial    | Factories, warehouses         | Very High          |
| Agricultural  | Farming, plantations          | Medium             |
| Mixed-Use     | Residential + Commercial      | High               |
| Institutional | Schools, hospitals, churches  | Very High          |
| Recreational  | Parks, resorts                | Medium             |

**Workflow impact**

* Determines **permit checklist**
* Determines **professional recommendations**
* Determines **allowed building types**

---

## A2. Land Tenure / Type (Based on Ghana Law)

This is critical and must be **mandatory**.

### Recognized Land Types in Ghana

(Aligned with Land Act, 2020 – Act 1036)

| Type               | Description                            | Sale Notes                             |
| ------------------ | -------------------------------------- | -------------------------------------- |
| Stool Land         | Owned by stools (chiefs)               | Requires traditional authority consent |
| Skin Land          | Northern Ghana equivalent              | Same as stool land                     |
| Family Land        | Owned by family lineage                | Requires family resolution             |
| Customary Freehold | Perpetual interest under customary law | Common but risky                       |
| Leasehold          | Fixed-term interest (e.g. 50/99 years) | Most common                            |
| State Land         | Government-owned                       | Usually leasehold                      |
| Vested Land        | Joint state + customary ownership      | Special consent required               |
| Private Freehold   | Absolute ownership                     | Rare                                   |

**Workflow impact**

* Controls **verification complexity**
* Controls **lease period requirement**
* Influences **lawyer assignment**
* Affects **foreign buyer eligibility**

---

## A3. Lease Period (If Leasehold)

Mandatory when `tenureType = LEASEHOLD`

| Field           | Rule                |
| --------------- | ------------------- |
| Lease duration  | 1–99 years          |
| Remaining years | Auto-calculated     |
| Start date      | Optional (if known) |
| Renewable       | Yes/No              |

**Workflow impact**

* Display prominently on listing
* Used in valuation guidance
* Required for transaction completion
* Required for permit application

---

## A4. Payment Structure (Sales Model)

### Allowed Payment Types

| Type             | Rules                        |
| ---------------- | ---------------------------- |
| Outright Payment | Default                      |
| Installment Plan | Optional (seller-controlled) |

### Installment Plan Attributes

| Field                 | Description              |
| --------------------- | ------------------------ |
| Initial deposit (%)   | e.g. 20–50%              |
| Installment duration  | 3–36 months              |
| Installment frequency | Monthly / Quarterly      |
| Penalty terms         | Optional                 |
| Ownership transfer    | Only after final payment |

**Workflow impact**

* Creates **payment schedule**
* Locks title documents until completion
* Requires **escrow milestone tracking**
* Strongly tied to **dispute module**

---

## A5. Land Commission Verification Seal

### Verified Status Levels

| Level                     | Meaning               | Seal                      |
| ------------------------- | --------------------- | ------------------------- |
| Unverified                | No checks             | None                      |
| Documents Uploaded        | Seller-provided       | Gray                      |
| Platform Reviewed         | Internal review       | Orange                    |
| Lands Commission Verified | Official verification | **Green Verified Seal** ✅ |

### Verified Seal Rules

* Seal appears:

  * On listing cards
  * On listing detail page
  * On transaction workspace
* Seal links to **verification certificate**
* Seal is **immutable** unless revoked

**Workflow impact**

* Buyers can filter by “Verified Only”
* Verified lands enjoy:

  * Higher trust
  * Featured ranking
  * Faster transactions
* Business monetization lever (paid verification)

---

# B. CONNECTED USER WORKFLOWS (UPDATED WITH YOUR NOTES)

Below shows **how the new land attributes influence workflows**.

---

## B1. Guest → Buyer → Purchase → Build

1. Guest browses listings
2. Filters by:

   * Residential
   * Leasehold (99 years)
   * Lands Commission Verified
3. Creates buyer account
4. Makes offer
5. Chooses:

   * Outright OR
   * Installment plan
6. Transaction created
7. Verification + lawyer service triggered
8. Transaction completes
9. Buyer requests:

   * Architect → drawings
   * Permit application
10. Permit approved
11. Construction begins

---

## B2. Seller → Listing → Verification → Sale

1. Seller creates listing
2. Selects:

   * Land category
   * Tenure type
   * Lease period
   * Payment model
3. Uploads documents
4. Requests Land Commission verification
5. Listing gets **Verified Seal**
6. Buyer makes offer
7. Escrow transaction
8. Sale completes

---

## B3. Buyer/Seller → Agent / Lawyer / Surveyor

Triggered from:

* Listing page
* Transaction workspace
* Permit dashboard

Flow:

1. User requests service
2. ServiceRequest created
3. Professional accepts
4. Booking confirmed
5. Deliverables uploaded
6. Used in:

   * Transaction
   * Verification
   * Permit submission

---

## B4. Architect / Draftsman → Permit Flow

1. Permit checklist detects missing drawings
2. User clicks “Hire Architect”
3. Architect uploads:

   * Architectural drawings
   * Structural drawings
4. Permit application unlocked
5. Submitted to assembly
6. Approved

---

# C. BUSINESS MODEL (RECOMMENDED & GHANA-REALISTIC)

This is where Buy Ghana Lands becomes **sustainable**.

---

## C1. Revenue Streams (Primary)

### 1. Listing Fees (Sellers)

| Tier           | Fee                       |
| -------------- | ------------------------- |
| Basic listing  | Free (limited visibility) |
| Standard       | GH₵100                    |
| Featured       | GH₵300                    |
| Verified Boost | +GH₵200                   |

---

### 2. Transaction Fee (Escrow)

| Item              | Fee        |
| ----------------- | ---------- |
| Land sale         | 1.5%       |
| Installment admin | +0.5%      |
| Dispute mediation | GH₵200–500 |

---

### 3. Verification Services

| Service                       | Fee          |
| ----------------------------- | ------------ |
| Platform review               | GH₵150       |
| Lands Commission verification | GH₵500–1,000 |

---

### 4. Professional Marketplace Commission

| Item               | Fee                |
| ------------------ | ------------------ |
| Service booking    | 10–15%             |
| Priority placement | Subscription-based |

---

### 5. Permit Processing Fee

| Item                  | Fee          |
| --------------------- | ------------ |
| Permit facilitation   | GH₵300–1,000 |
| Document coordination | Add-on       |

---

## C2. Subscription Plans (By User Category)

### Buyers (Optional)

| Plan      | Monthly                                         |
| --------- | ----------------------------------------------- |
| Free      | Basic browsing                                  |
| Pro Buyer | GH₵50 (alerts, priority support, install plans) |

---

### Sellers / Agents

| Plan        | Monthly   |
| ----------- | --------- |
| Free        | 1 listing |
| Seller Plus | GH₵150    |
| Agent Pro   | GH₵300    |
| Developer   | GH₵600    |

---

### Professionals (Surveyors, Lawyers, Architects)

| Plan              | Monthly                       |
| ----------------- | ----------------------------- |
| Free              | Directory only                |
| Professional Plus | GH₵200                        |
| Verified Partner  | GH₵400 (priority jobs + seal) |

---

### Institutional / Enterprise

* District Assemblies
* Banks
* Developers
* NGOs

**Pricing:** Custom (API + dashboards)

---

# D. WHY THIS MODEL WORKS IN GHANA

* Free entry removes adoption friction
* Verification + trust is monetized (buyers pay)
* Professionals fund growth (recurring revenue)
* Installments unlock mass-market demand
* Diaspora-friendly
* Government-aligned (permits + verification)

---


# Buy Ghana Lands - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Public    │  │    User     │  │   Admin     │  │   Shared    │    │
│  │   Pages     │  │  Dashboard  │  │  Dashboard  │  │ Components  │    │
│  │  (main)     │  │ (dashboard) │  │  (admin)    │  │    (ui)     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            API LAYER                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │    Auth     │  │  Listings   │  │Transactions │  │   Admin     │    │
│  │   Routes    │  │   Routes    │  │   Routes    │  │   Routes    │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │    Auth     │  │  Payments   │  │   Email     │  │    SMS      │    │
│  │  (NextAuth) │  │ (Paystack)  │  │  (Resend)   │  │  (Hubtel)   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │
│  │   Storage   │  │Subscriptions│  │Permissions  │                     │
│  │(Cloudinary) │  │   & Fees    │  │   (RBAC)    │                     │
│  └─────────────┘  └─────────────┘  └─────────────┘                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    PostgreSQL + Prisma ORM                       │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │  Users  │ │Listings │ │  Trans  │ │Payments │ │Messages │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Core Flows

### 1. User Registration Flow

```
User → Register Page → Select Account Type → Select Plan (if required)
    → Enter Details → Submit → API: /api/auth/register
    → Create User in DB → Send Verification Email
    → Redirect to Verify Email Page → User Clicks Link
    → API: /api/auth/verify-email → Update User → Redirect to Login
```

### 2. Listing Creation Flow

```
Seller → Dashboard → Create Listing → Fill Form (details, location, media)
    → Submit → API: POST /api/listings → Create in DB (status: DRAFT)
    → Upload Media → API: /api/upload → Cloudinary
    → Submit for Review → Update status: SUBMITTED
    → Admin Reviews → Approve/Reject → Update status: PUBLISHED/REJECTED
```

### 3. Transaction (Escrow) Flow

```
Buyer → View Listing → Make Offer → API: POST /api/offers
    → Seller Accepts → Create Transaction (status: CREATED)
    → Buyer Funds Escrow → API: POST /api/transactions/[id]/fund
    → Payment via Paystack → Webhook confirms → status: FUNDED
    → Verification Period (7 days) → status: VERIFICATION_PERIOD
    → Buyer Confirms → status: READY_TO_RELEASE
    → Admin/System Releases → status: RELEASED → Seller receives funds
```

### 4. Admin Moderation Flow

```
Admin → Admin Dashboard → View Pending Items
    → Select Item → Review Details
    → Take Action (Approve/Reject/Suspend)
    → API: PUT /api/admin/[resource]/[id]
    → Update DB → Create Audit Log → Send Notification to User
```

---

## Authentication System

### NextAuth.js Configuration

```typescript
// src/lib/auth.ts
- Provider: Credentials (phone + password)
- Session Strategy: JWT
- Callbacks: jwt, session (attach user data)
```

### Session Data
```typescript
interface Session {
  user: {
    id: string;
    fullName: string;
    phone: string;
    email?: string;
    roles: string[];
    kycTier: string;
    accountStatus: string;
  }
}
```

### Protected Routes
- `(dashboard)/*` - Requires authenticated user
- `(admin)/*` - Requires ADMIN, SUPPORT, or MODERATOR role

---

## Database Schema Overview

### Core Entities

```
User (1) ──────< Listing (many)
  │                  │
  │                  ▼
  │            Transaction
  │           /          \
  └──< Buyer              Seller >──┘
           │
           ▼
        Payment
           │
           ▼
        Dispute
```

### Key Relationships

| Parent | Child | Relationship |
|--------|-------|--------------|
| User | Listing | One-to-Many (seller) |
| User | Transaction | One-to-Many (buyer/seller) |
| Listing | Transaction | One-to-Many |
| Transaction | Payment | One-to-Many |
| Transaction | Dispute | One-to-Many |
| User | Message | One-to-Many (sender/receiver) |
| User | ProfessionalProfile | One-to-One |
| User | Subscription | One-to-Many |

---

## Subscription System

### Account Types & Plans

| Account Type | Plans | Requires Subscription |
|--------------|-------|----------------------|
| BUYER | Free, Plus, Premium | No |
| SELLER | Free, Basic, Pro, Enterprise | No |
| AGENT | Basic, Pro, Elite | Yes |
| PROFESSIONAL | Basic, Pro, Elite | Yes |

### Fee Structure

```typescript
// Transaction fees based on seller plan
SELLER_FREE: 5% of transaction
SELLER_BASIC: 4% of transaction
SELLER_PRO: 3% of transaction
SELLER_ENTERPRISE: 2% of transaction

// Professional service fees
PROFESSIONAL_BASIC: 12% commission
PROFESSIONAL_PRO: 8% commission
PROFESSIONAL_ELITE: 5% commission
```

---

## External Integrations

### Payment Gateways

| Provider | Usage | Webhook |
|----------|-------|---------|
| Paystack | Primary payments | `/api/webhooks/paystack` |
| Flutterwave | Alternative | `/api/webhooks/flutterwave` |

### Communication

| Provider | Usage | API |
|----------|-------|-----|
| Resend | Transactional emails | `src/lib/email.ts` |
| Hubtel | SMS notifications | `src/lib/sms.ts` |

### Storage

| Provider | Usage | API |
|----------|-------|-----|
| Cloudinary | Images, documents | `src/lib/cloudinary.ts` |

---

## Security Measures

### Authentication
- Password hashing: bcrypt (12 rounds)
- JWT tokens for session
- Email verification required

### Authorization
- Role-based access control (RBAC)
- API route protection via middleware
- Admin actions require admin roles

### Data Protection
- Input validation with Zod
- SQL injection prevention via Prisma
- XSS prevention via React

### Audit Trail
- All admin actions logged to `AuditLog` table
- Includes: actor, action, entity, timestamp, diff

---

## Error Handling

### API Response Format

```typescript
// Success
{ data: {...}, message?: string }

// Error
{ error: "Error message" }
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation) |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## Caching Strategy

- **Static pages**: ISR with revalidation
- **API responses**: No caching (real-time data)
- **Images**: Cloudinary CDN caching

---

## Deployment

### Requirements
- Node.js 18+
- PostgreSQL 14+
- Environment variables configured

### Build Commands
```bash
npm install          # Install dependencies
npx prisma generate  # Generate Prisma client
npx prisma db push   # Sync database schema
npm run build        # Build Next.js app
npm start            # Start production server
```

### Recommended Hosting
- **App**: Vercel, Railway, or similar
- **Database**: Supabase, Neon, or managed PostgreSQL
- **Media**: Cloudinary (already integrated)

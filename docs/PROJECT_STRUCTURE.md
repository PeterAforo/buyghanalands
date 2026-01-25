# Buy Ghana Lands - Project Structure

## Overview

Buy Ghana Lands is a Next.js 15 application for buying, selling, and managing land transactions in Ghana. It includes escrow services, professional services marketplace, and comprehensive admin tools.

---

## Directory Structure

```
buyghanalands/
├── docs/                    # Documentation files
├── prisma/                  # Database schema and migrations
├── public/                  # Static assets
├── scripts/                 # Utility scripts
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (admin)/         # Admin dashboard (protected)
│   │   ├── (dashboard)/     # User dashboard (protected)
│   │   ├── (main)/          # Public-facing pages
│   │   └── api/             # API routes
│   ├── components/          # React components
│   ├── lib/                 # Utility libraries
│   └── types/               # TypeScript types
└── package.json
```

---

## Route Groups Explained

### 1. `(main)` - Public Pages
Public-facing pages accessible to all users.

| Route | File | Description |
|-------|------|-------------|
| `/` | `page.tsx` | Homepage with hero, features, listings |
| `/listings` | `listings/page.tsx` | Browse all land listings |
| `/listings/[id]` | `listings/[id]/page.tsx` | Single listing detail |
| `/professionals` | `professionals/page.tsx` | Browse professionals |
| `/professionals/[id]` | `professionals/[id]/page.tsx` | Professional profile |
| `/pricing` | `pricing/page.tsx` | Subscription plans |
| `/about` | `about/page.tsx` | About the platform |
| `/contact` | `contact/page.tsx` | Contact form |
| `/auth/login` | `auth/login/page.tsx` | User login |
| `/auth/register` | `auth/register/page.tsx` | User registration |
| `/auth/verify-email` | `auth/verify-email/page.tsx` | Email verification |

### 2. `(dashboard)` - User Dashboard
Protected pages for authenticated users.

| Route | File | Description |
|-------|------|-------------|
| `/dashboard` | `page.tsx` | User dashboard home |
| `/dashboard/listings` | `listings/page.tsx` | Manage my listings |
| `/dashboard/transactions` | `transactions/page.tsx` | My transactions |
| `/dashboard/messages` | `messages/page.tsx` | Messaging center |
| `/dashboard/favorites` | `favorites/page.tsx` | Saved listings |
| `/dashboard/settings` | `settings/page.tsx` | Account settings |
| `/dashboard/workflows` | `workflows/page.tsx` | Property workflows |

### 3. `(admin)` - Admin Dashboard
Protected pages for admin/moderator users.

| Route | File | Description |
|-------|------|-------------|
| `/admin` | `page.tsx` | Admin dashboard home |
| `/admin/users` | `users/page.tsx` | User management (CRUD) |
| `/admin/listings` | `listings/page.tsx` | Listing moderation (CRUD) |
| `/admin/transactions` | `transactions/page.tsx` | Transaction management |
| `/admin/verifications` | `verifications/page.tsx` | KYC verifications |
| `/admin/disputes` | `disputes/page.tsx` | Dispute resolution |
| `/admin/analytics` | `analytics/page.tsx` | Platform analytics |
| `/admin/settings` | `settings/page.tsx` | Platform settings |

---

## API Routes Structure

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/[...nextauth]` | NextAuth.js handlers |
| POST | `/api/auth/verify-email` | Verify email token |
| POST | `/api/auth/resend-verification` | Resend verification email |

### Listings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/listings` | Get all listings (with filters) |
| POST | `/api/listings` | Create new listing |
| GET | `/api/listings/[id]` | Get single listing |
| PUT | `/api/listings/[id]` | Update listing |
| DELETE | `/api/listings/[id]` | Delete listing |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | Get user transactions |
| POST | `/api/transactions` | Create transaction |
| GET | `/api/transactions/[id]` | Get transaction details |
| PUT | `/api/transactions/[id]` | Update transaction |

### Admin APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/PUT | `/api/admin/users` | User management |
| GET/PUT/PATCH/DELETE | `/api/admin/users/[id]` | Single user operations |
| GET/PUT | `/api/admin/listings` | Listing moderation |
| GET/PUT/PATCH/DELETE | `/api/admin/listings/[id]` | Single listing operations |
| GET/PUT | `/api/admin/transactions` | Transaction management |

---

## Components Organization

```
src/components/
├── ui/                      # Base UI components (shadcn/ui)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── badge.tsx
│   ├── dialog.tsx
│   ├── tabs.tsx
│   └── ...
├── layout/                  # Layout components
│   ├── header.tsx
│   ├── footer.tsx
│   └── sidebar.tsx
├── listings/                # Listing-related components
│   ├── listing-card.tsx
│   ├── listing-grid.tsx
│   └── listing-filters.tsx
├── dashboard/               # Dashboard components
│   ├── stats-card.tsx
│   └── activity-feed.tsx
├── admin/                   # Admin-specific components
│   ├── data-table.tsx
│   └── stats-overview.tsx
├── workflow/                # Workflow components
│   ├── workflow-progress.tsx
│   ├── stage-card.tsx
│   └── document-vault.tsx
└── providers/               # Context providers
    └── session-provider.tsx
```

---

## Library Files (`src/lib/`)

| File | Purpose |
|------|---------|
| `auth.ts` | NextAuth.js configuration |
| `db.ts` | Prisma client instance |
| `subscriptions.ts` | Subscription plans & pricing |
| `fees.ts` | Transaction fee calculations |
| `permissions.ts` | Role-based access control |
| `email.ts` | Email sending (Resend) |
| `sms.ts` | SMS sending (Hubtel) |
| `cloudinary.ts` | Image upload handling |
| `paystack.ts` | Paystack payment integration |
| `flutterwave.ts` | Flutterwave payment integration |
| `ghana-locations.ts` | Ghana regions/districts data |
| `notifications.ts` | In-app notifications |
| `validations.ts` | Zod validation schemas |
| `utils.ts` | Utility functions |

---

## Database Schema (Key Models)

| Model | Description |
|-------|-------------|
| `User` | User accounts with roles, KYC status |
| `Listing` | Land listings with location, price, media |
| `Transaction` | Escrow transactions between buyer/seller |
| `Payment` | Payment records (Paystack/Flutterwave) |
| `Offer` | Offers made on listings |
| `Message` | User-to-user messages |
| `Dispute` | Transaction disputes |
| `ProfessionalProfile` | Professional service providers |
| `PropertyWorkflow` | Land acquisition workflows |
| `Subscription` | User subscription plans |

---

## User Roles

| Role | Access Level |
|------|--------------|
| `BUYER` | Browse, purchase, make offers |
| `SELLER` | List properties, manage sales |
| `AGENT` | Manage clients, listings |
| `PROFESSIONAL` | Offer services (surveyor, lawyer, etc.) |
| `ADMIN` | Full platform access |
| `SUPPORT` | Customer support access |
| `MODERATOR` | Content moderation |

---

## Key Features

1. **Land Listings** - Browse, search, filter properties
2. **Escrow Transactions** - Secure buyer-seller transactions
3. **Professional Services** - Hire surveyors, lawyers, architects
4. **Property Workflows** - Track land acquisition process
5. **Subscription Plans** - Tiered features for different user types
6. **Admin Dashboard** - Full CRUD for users, listings, transactions
7. **KYC Verification** - Ghana Card verification
8. **Messaging** - In-app communication
9. **Notifications** - Email, SMS, in-app alerts

---

## Environment Variables

See `.env.example` for required environment variables:
- Database connection (PostgreSQL)
- NextAuth secret
- Payment gateways (Paystack, Flutterwave)
- Email service (Resend)
- SMS service (Hubtel)
- Cloud storage (Cloudinary)

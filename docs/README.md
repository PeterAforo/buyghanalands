# Buy Ghana Lands - Documentation

## Quick Links

| Document | Description |
|----------|-------------|
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Complete project structure, routes, and file organization |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | UI components, colors, typography, and styling standards |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture, flows, and integrations |
| [API_REFERENCE.md](./API_REFERENCE.md) | Complete API endpoint documentation |
| [subscription-system.md](./subscription-system.md) | Subscription plans and pricing details |
| [PRD.md](./PRD.md) | Original Product Requirements Document |

---

## Quick Start

### 1. Setup
```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your values

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Run development server
npm run dev
```

### 2. Access Points
- **Public Site**: http://localhost:3000
- **User Dashboard**: http://localhost:3000/dashboard
- **Admin Dashboard**: http://localhost:3000/admin

### 3. Default Test Accounts
Create via admin or registration:
- Admin: Requires ADMIN role in database
- User: Register via /auth/register

---

## Key Concepts

### User Roles
| Role | Description |
|------|-------------|
| BUYER | Can browse and purchase land |
| SELLER | Can list and sell land |
| AGENT | Real estate agent with client management |
| PROFESSIONAL | Service provider (surveyor, lawyer, etc.) |
| ADMIN | Full platform access |
| SUPPORT | Customer support access |
| MODERATOR | Content moderation |

### Transaction States
```
CREATED → ESCROW_REQUESTED → FUNDED → VERIFICATION_PERIOD 
    → READY_TO_RELEASE → RELEASED (or DISPUTED → REFUNDED)
```

### Listing States
```
DRAFT → SUBMITTED → UNDER_REVIEW → PUBLISHED (or REJECTED)
    → SOLD (or SUSPENDED)
```

---

## Common Tasks

### Add a New Page
1. Create file in appropriate route group:
   - Public: `src/app/(main)/your-page/page.tsx`
   - Dashboard: `src/app/(dashboard)/your-page/page.tsx`
   - Admin: `src/app/(admin)/admin/your-page/page.tsx`

### Add a New API Route
1. Create file: `src/app/api/your-route/route.ts`
2. Export HTTP methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`

### Add a New Component
1. Create in appropriate folder under `src/components/`
2. Follow design system guidelines

### Modify Database Schema
1. Edit `prisma/schema.prisma`
2. Run `npx prisma db push` (development)
3. Or `npx prisma migrate dev` (with migration)

---

## Troubleshooting

### Common Issues

**"Module not found" errors**
- Run `npm install`
- Check import paths use `@/` prefix

**Database connection errors**
- Verify `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running

**Authentication issues**
- Check `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your domain

**Build errors**
- Run `npx prisma generate` before build
- Check for TypeScript errors: `npm run lint`

---

## Need Help?

1. Check the documentation files above
2. Review the PRD for feature requirements
3. Check existing similar code for patterns

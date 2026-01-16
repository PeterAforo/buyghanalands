# Buy Ghana Lands

Ghana's trusted platform for secure land transactions. Verified listings, protected payments, and professional services for buyers and sellers.

## Features

- **Verified Listings** - Platform-reviewed and Lands Commission verified properties
- **Protected Payments** - Escrow-style transaction protection via Paystack
- **Document Vault** - Secure storage for land documents with access controls
- **Professional Network** - Connect with surveyors, lawyers, and architects
- **Building Permits** - Apply for and track permit applications
- **Multi-role Support** - Buyers, sellers, agents, and professionals

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: NeonDB (PostgreSQL + PostGIS)
- **ORM**: Prisma 7
- **Authentication**: Auth.js (NextAuth v5)
- **Styling**: Tailwind CSS
- **Payments**: Paystack
- **Maps**: Mapbox

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- NeonDB account (or PostgreSQL with PostGIS)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/PeterAforo/buyghanalands.git
cd buyghanalands
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
AUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
MAPBOX_ACCESS_TOKEN="pk...."
PAYSTACK_SECRET_KEY="sk_..."
PAYSTACK_PUBLIC_KEY="pk_..."
```

4. Push database schema:
```bash
npm run db:push
```

5. Generate Prisma client:
```bash
npm run db:generate
```

6. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── listings/          # Land listings
│   ├── permits/           # Building permits
│   └── professionals/     # Professional services
├── components/            # React components
│   ├── layout/           # Header, footer
│   ├── providers/        # Context providers
│   └── ui/               # UI components
├── lib/                   # Utilities and configurations
│   ├── auth.ts           # Auth.js configuration
│   ├── db.ts             # Prisma client
│   ├── paystack.ts       # Payment integration
│   ├── utils.ts          # Helper functions
│   └── validations.ts    # Zod schemas
└── types/                 # TypeScript types
```

## API Endpoints

- `POST /api/auth/register` - User registration
- `GET/POST /api/listings` - Land listings CRUD
- `GET/POST /api/offers` - Offer management
- `GET/POST /api/transactions` - Transaction management
- `GET/POST /api/payments` - Payment initialization
- `GET/POST /api/verifications` - Verification requests
- `GET/POST /api/messages` - Messaging

## User Roles

- **BUYER** - Browse and purchase land
- **SELLER** - List and sell land
- **AGENT** - Manage multiple listings
- **PROFESSIONAL** - Offer surveying, legal, architectural services
- **ADMIN** - Platform management
- **SUPPORT** - Customer support
- **MODERATOR** - Content moderation

## Deployment

Deploy to Vercel:

```bash
vercel
```

Or use the Vercel dashboard to connect your GitHub repository.

## License

Private - All rights reserved.

## Support

For support, email support@buyghanalands.com

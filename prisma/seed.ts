import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { config } from "dotenv";
import { resolve } from "path";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

// Load .env file from project root
config({ path: resolve(__dirname, "../.env") });

const connectionString = process.env.DATABASE_URL;
console.log("Connection string loaded:", connectionString ? "Yes" : "No");

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { phone: "0200000001" },
    update: {},
    create: {
      phone: "0200000001",
      email: "admin@buyghanalands.com",
      fullName: "System Admin",
      passwordHash: adminPassword,
      roles: ["ADMIN", "MODERATOR", "SUPPORT"],
      kycTier: "TIER_2_GHANA_CARD",
    },
  });
  console.log("Created admin user:", admin.id);

  // Create demo buyer
  const buyerPassword = await hash("buyer123", 12);
  const buyer = await prisma.user.upsert({
    where: { phone: "0200000002" },
    update: {},
    create: {
      phone: "0200000002",
      email: "buyer@example.com",
      fullName: "Kwame Asante",
      passwordHash: buyerPassword,
      roles: ["BUYER"],
      kycTier: "TIER_1_ID_UPLOAD",
    },
  });
  console.log("Created buyer user:", buyer.id);

  // Create demo seller
  const sellerPassword = await hash("seller123", 12);
  const seller = await prisma.user.upsert({
    where: { phone: "0200000003" },
    update: {},
    create: {
      phone: "0200000003",
      email: "seller@example.com",
      fullName: "Ama Serwaa",
      passwordHash: sellerPassword,
      roles: ["SELLER"],
      kycTier: "TIER_1_ID_UPLOAD",
    },
  });
  console.log("Created seller user:", seller.id);

  // Create demo listings
  const listings = [
    {
      sellerId: seller.id,
      title: "Prime Residential Land in East Legon",
      description:
        "Beautiful residential plot in the heart of East Legon. Close to American House and major amenities. Perfect for building your dream home. The land has all necessary documentation including site plan and indenture.",
      region: "Greater Accra",
      district: "Accra Metropolitan",
      town: "East Legon",
      latitude: 5.6356,
      longitude: -0.1574,
      landType: "RESIDENTIAL" as const,
      tenureType: "FREEHOLD" as const,
      sizeAcres: 0.5,
      sizePlots: 2,
      priceGhs: BigInt(850000),
      negotiable: true,
      status: "PUBLISHED" as const,
      verificationLevel: "LEVEL_2_PLATFORM_REVIEWED" as const,
      publishedAt: new Date(),
    },
    {
      sellerId: seller.id,
      title: "Commercial Plot at Tema Community 25",
      description:
        "Strategic commercial land perfect for business development. Located along the main road with high visibility. Ideal for retail, office complex, or mixed-use development.",
      region: "Greater Accra",
      district: "Tema Metropolitan",
      town: "Community 25",
      latitude: 5.6892,
      longitude: -0.0167,
      landType: "COMMERCIAL" as const,
      tenureType: "LEASEHOLD" as const,
      leaseDurationYears: 50,
      sizeAcres: 1.2,
      sizePlots: 5,
      priceGhs: BigInt(1500000),
      negotiable: true,
      status: "PUBLISHED" as const,
      verificationLevel: "LEVEL_3_OFFICIAL_VERIFIED" as const,
      publishedAt: new Date(),
    },
    {
      sellerId: seller.id,
      title: "Agricultural Land in Aburi",
      description:
        "Fertile agricultural land in the Akuapem Ridge area. Perfect for farming or agribusiness. Beautiful mountain views and good rainfall. Access road available.",
      region: "Eastern",
      district: "Akuapem South",
      town: "Aburi",
      latitude: 5.8489,
      longitude: -0.1756,
      landType: "AGRICULTURAL" as const,
      tenureType: "CUSTOMARY" as const,
      sizeAcres: 10,
      priceGhs: BigInt(300000),
      negotiable: true,
      status: "PUBLISHED" as const,
      verificationLevel: "LEVEL_1_DOCS_UPLOADED" as const,
      publishedAt: new Date(),
    },
  ];

  for (const listing of listings) {
    const created = await prisma.listing.create({ data: listing });
    console.log("Created listing:", created.id);
  }

  // Create demo district assemblies
  const assemblies = [
    {
      name: "Accra Metropolitan Assembly",
      region: "Greater Accra",
      district: "Accra Metropolitan",
      contactEmail: "info@ama.gov.gh",
      contactPhone: "0302123456",
    },
    {
      name: "Tema Metropolitan Assembly",
      region: "Greater Accra",
      district: "Tema Metropolitan",
      contactEmail: "info@tema.gov.gh",
      contactPhone: "0303123456",
    },
    {
      name: "Kumasi Metropolitan Assembly",
      region: "Ashanti",
      district: "Kumasi Metropolitan",
      contactEmail: "info@kma.gov.gh",
      contactPhone: "0322123456",
    },
  ];

  for (const assembly of assemblies) {
    const created = await prisma.districtAssembly.upsert({
      where: { name: assembly.name },
      update: {},
      create: assembly,
    });
    console.log("Created assembly:", created.id);
  }

  // Create demo professional
  const professionalPassword = await hash("professional123", 12);
  const professionalUser = await prisma.user.upsert({
    where: { phone: "0200000004" },
    update: {},
    create: {
      phone: "0200000004",
      email: "surveyor@example.com",
      fullName: "Kofi Mensah",
      passwordHash: professionalPassword,
      roles: ["PROFESSIONAL"],
      kycTier: "TIER_1_ID_UPLOAD",
    },
  });

  await prisma.professionalProfile.upsert({
    where: { userId: professionalUser.id },
    update: {},
    create: {
      userId: professionalUser.id,
      professionalType: "SURVEYOR",
      bio: "Licensed surveyor with over 15 years of experience in land surveying and mapping across Ghana.",
      companyName: "Mensah Surveying Services",
      yearsExperience: 15,
      serviceRegions: ["Greater Accra", "Eastern", "Central"],
      baseLocation: "Accra",
      latitude: 5.6037,
      longitude: -0.187,
      licenseNumber: "GhIS-2010-1234",
      licenseBody: "Ghana Institution of Surveyors",
      licenseStatus: "VERIFIED",
      isActive: true,
    },
  });
  console.log("Created professional profile");

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env from project root so DATABASE_URL is available
config({ path: resolve(__dirname, "../.env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const prisma = new PrismaClient();

const DEMO_EMAIL_DOMAIN = "@lands.demo";

// -------- Data pools --------
const LAND_IMAGE_COUNT = 15;
const landImage = (n: number) => `/images/listings/land-${(n % LAND_IMAGE_COUNT) + 1}.jpg`;

const professionalAvatar = (type: string, n: number) =>
  `/images/professionals/${type.toLowerCase()}-${(n % 3) + 1}.jpg`;

const locations: {
  region: string;
  district: string;
  town: string;
  lat: number;
  lng: number;
}[] = [
  { region: "Greater Accra", district: "Accra Metropolitan", town: "East Legon", lat: 5.6356, lng: -0.1574 },
  { region: "Greater Accra", district: "Tema Metropolitan", town: "Community 25", lat: 5.6892, lng: -0.0167 },
  { region: "Greater Accra", district: "Ga East", town: "Adenta", lat: 5.7089, lng: -0.1503 },
  { region: "Greater Accra", district: "La Nkwantanang", town: "Madina", lat: 5.6836, lng: -0.1669 },
  { region: "Ashanti", district: "Kumasi Metropolitan", town: "Ejisu", lat: 6.6885, lng: -1.4693 },
  { region: "Ashanti", district: "Oforikrom", town: "Ayeduase", lat: 6.6745, lng: -1.5716 },
  { region: "Ashanti", district: "Asokore Mampong", town: "Aboabo", lat: 6.7189, lng: -1.5501 },
  { region: "Western", district: "Sekondi-Takoradi", town: "Anaji", lat: 4.9126, lng: -1.7873 },
  { region: "Western", district: "Ahanta West", town: "Agona Nkwanta", lat: 4.8919, lng: -1.9628 },
  { region: "Central", district: "Cape Coast Metropolitan", town: "Abura", lat: 5.1315, lng: -1.2795 },
  { region: "Central", district: "Awutu Senya East", town: "Kasoa", lat: 5.5346, lng: -0.4241 },
  { region: "Eastern", district: "Akuapem South", town: "Aburi", lat: 5.8489, lng: -0.1756 },
  { region: "Eastern", district: "New Juaben", town: "Koforidua", lat: 6.0941, lng: -0.2591 },
  { region: "Northern", district: "Tamale Metropolitan", town: "Vittin", lat: 9.4008, lng: -0.8393 },
  { region: "Volta", district: "Ho Municipal", town: "Ho", lat: 6.6008, lng: 0.4713 },
  { region: "Bono", district: "Sunyani Municipal", town: "Fiapre", lat: 7.3349, lng: -2.3123 },
];

const landTypes = ["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "AGRICULTURAL", "MIXED"] as const;
const tenureTypes = ["FREEHOLD", "LEASEHOLD", "CUSTOMARY"] as const;
const verificationLevels = [
  "LEVEL_0_UNVERIFIED",
  "LEVEL_1_DOCS_UPLOADED",
  "LEVEL_2_PLATFORM_REVIEWED",
  "LEVEL_3_OFFICIAL_VERIFIED",
] as const;

const titleByType: Record<string, string[]> = {
  RESIDENTIAL: ["Prime Residential Plot", "Serviced Residential Land", "Gated Community Plot", "Family Home Plot"],
  COMMERCIAL: ["Commercial Land", "Roadside Commercial Plot", "Retail Development Land", "Office Complex Plot"],
  INDUSTRIAL: ["Industrial Land", "Warehouse Development Plot", "Factory Site", "Logistics Yard Land"],
  AGRICULTURAL: ["Fertile Farmland", "Agricultural Acreage", "Plantation Land", "Irrigated Farm Plot"],
  MIXED: ["Mixed-Use Development Land", "Commercial & Residential Plot", "Investment Land Parcel"],
};

const descriptions = [
  "Well-documented parcel with site plan and indenture. Accessible road and utilities nearby. Ideal for immediate development.",
  "Strategically located with high growth potential. Clear title and demarcated boundaries. Registrable at Lands Commission.",
  "Beautiful, level plot ready for construction. Close to schools, markets and transport links. Litigation-free.",
  "Genuine land with proper documentation and clear ownership history. Perfect for buyers and long-term investors.",
  "Prime location in a fast-developing area. Fully demarcated with pillars. Suitable for residential or commercial use.",
];

const firstNames = ["Kwame", "Ama", "Kofi", "Akosua", "Yaw", "Abena", "Kojo", "Adwoa", "Kwabena", "Efua", "Kwaku", "Esi", "Fiifi", "Nana", "Kobina", "Araba", "Kwadwo", "Akua", "Yaa", "Kweku"];
const lastNames = ["Mensah", "Osei", "Boateng", "Owusu", "Asante", "Appiah", "Agyeman", "Darko", "Adjei", "Frimpong", "Ansah", "Baffour", "Sarpong", "Amoah", "Antwi", "Gyasi", "Nkrumah", "Danso", "Ofori", "Acheampong"];

const professionalTypes = ["SURVEYOR", "LAWYER", "ARCHITECT", "ENGINEER", "PLANNER", "VALUER"] as const;

const proMeta: Record<string, { company: string; body: string; bio: string; services: string[] }> = {
  SURVEYOR: {
    company: "Surveying Services",
    body: "Ghana Institution of Surveyors",
    bio: "Licensed surveyor specialising in cadastral and boundary surveys, site plans and land demarcation across Ghana.",
    services: ["Boundary survey", "Site plan preparation", "Topographic survey"],
  },
  LAWYER: {
    company: "Legal Chambers",
    body: "Ghana Bar Association",
    bio: "Property lawyer experienced in land title searches, conveyancing and dispute resolution.",
    services: ["Title search", "Conveyancing & transfer", "Land dispute advisory"],
  },
  ARCHITECT: {
    company: "Design Studio",
    body: "Ghana Institute of Architects",
    bio: "Architect providing residential and commercial building design, permits and planning support.",
    services: ["Building design", "Permit drawings", "3D visualisation"],
  },
  ENGINEER: {
    company: "Engineering Consult",
    body: "Ghana Institution of Engineering",
    bio: "Civil/structural engineer offering site assessment, structural design and construction supervision.",
    services: ["Structural assessment", "Soil test coordination", "Construction supervision"],
  },
  PLANNER: {
    company: "Planning Consult",
    body: "Ghana Institute of Planners",
    bio: "Town planner supporting zoning advice, subdivision layouts and development permits.",
    services: ["Zoning advisory", "Subdivision layout", "Development permit support"],
  },
  VALUER: {
    company: "Valuation Partners",
    body: "Ghana Institution of Surveyors (Valuation)",
    bio: "Professional valuer providing independent market and mortgage valuations for land and property.",
    services: ["Market valuation", "Mortgage valuation", "Investment appraisal"],
  },
};

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length];
}

async function cleanupPreviousDemo() {
  const demoUsers = await prisma.user.findMany({
    where: { email: { endsWith: DEMO_EMAIL_DOMAIN } },
    select: { id: true },
  });
  const ids = demoUsers.map((u) => u.id);
  if (ids.length === 0) return;

  const profiles = await prisma.professionalProfile.findMany({
    where: { userId: { in: ids } },
    select: { id: true },
  });
  const profileIds = profiles.map((p) => p.id);

  const listings = await prisma.listing.findMany({
    where: { sellerId: { in: ids } },
    select: { id: true },
  });
  const listingIds = listings.map((l) => l.id);

  if (profileIds.length) {
    await prisma.professionalService.deleteMany({ where: { professionalId: { in: profileIds } } });
    await prisma.professionalProfile.deleteMany({ where: { id: { in: profileIds } } });
  }
  if (listingIds.length) {
    await prisma.listingMedia.deleteMany({ where: { listingId: { in: listingIds } } });
    await prisma.listing.deleteMany({ where: { id: { in: listingIds } } });
  }
  console.log(`Cleaned previous demo data for ${ids.length} users.`);
}

async function main() {
  console.log("Seeding demo data (30 listings + 30 professionals)...");
  await cleanupPreviousDemo();

  const password = await hash("demo1234", 12);

  // ---- Sellers (8) ----
  const sellers = [];
  for (let i = 0; i < 8; i++) {
    const fullName = `${pick(firstNames, i)} ${pick(lastNames, i + 3)}`;
    const phone = `02510${String(i).padStart(5, "0")}`;
    const seller = await prisma.user.upsert({
      where: { phone },
      update: { fullName, email: `seller${i}${DEMO_EMAIL_DOMAIN}` },
      create: {
        phone,
        email: `seller${i}${DEMO_EMAIL_DOMAIN}`,
        fullName,
        passwordHash: password,
        roles: ["SELLER"],
        kycTier: "TIER_1_ID_UPLOAD",
      },
    });
    sellers.push(seller);
  }
  console.log(`Ensured ${sellers.length} demo sellers.`);

  // ---- 30 Listings, each with 3 land photos ----
  let listingCount = 0;
  for (let i = 0; i < 30; i++) {
    const loc = pick(locations, i);
    const landType = pick(landTypes, i);
    const tenure = pick(tenureTypes, i);
    const seller = pick(sellers, i);
    const sizeAcres = Number((0.25 + (i % 12) * 0.75).toFixed(2));
    const pricePerAcre = 250000 + (i % 6) * 180000;
    const price = Math.round(sizeAcres * pricePerAcre);
    const titles = titleByType[landType];
    const title = `${pick(titles, i)} at ${loc.town}`;
    const totalPlots = 1 + (i % 5);

    const listing = await prisma.listing.create({
      data: {
        sellerId: seller.id,
        status: "PUBLISHED",
        title,
        description: pick(descriptions, i),
        region: loc.region,
        district: loc.district,
        town: loc.town,
        latitude: loc.lat,
        longitude: loc.lng,
        landType,
        tenureType: tenure,
        leaseDurationYears: tenure === "LEASEHOLD" ? 50 : null,
        sizeAcres,
        totalPlots,
        availablePlots: totalPlots,
        priceGhs: BigInt(price),
        negotiable: i % 3 !== 0,
        verificationLevel: pick(verificationLevels, i),
        publishedAt: new Date(Date.now() - i * 36e5),
        media: {
          create: [0, 1, 2].map((m) => ({
            type: "PHOTO" as const,
            url: landImage(i * 3 + m),
            sortOrder: m,
            width: 1200,
            height: 800,
          })),
        },
      },
    });
    listingCount++;
    if (listingCount % 10 === 0) console.log(`  ...${listingCount} listings created`);
    void listing;
  }
  console.log(`Created ${listingCount} demo listings with imagery.`);

  // ---- 30 Professionals (5 per type) with avatars + services ----
  let proCount = 0;
  for (let i = 0; i < 30; i++) {
    const type = professionalTypes[i % professionalTypes.length];
    const meta = proMeta[type];
    const fullName = `${pick(firstNames, i + 5)} ${pick(lastNames, i)}`;
    const phone = `02520${String(i).padStart(5, "0")}`;
    const loc = pick(locations, i * 2);
    const years = 3 + (i % 20);

    const user = await prisma.user.upsert({
      where: { phone },
      update: {
        fullName,
        email: `pro${i}${DEMO_EMAIL_DOMAIN}`,
        avatarUrl: professionalAvatar(type, i),
      },
      create: {
        phone,
        email: `pro${i}${DEMO_EMAIL_DOMAIN}`,
        fullName,
        passwordHash: password,
        roles: ["PROFESSIONAL"],
        kycTier: "TIER_1_ID_UPLOAD",
        avatarUrl: professionalAvatar(type, i),
      },
    });

    const profile = await prisma.professionalProfile.create({
      data: {
        userId: user.id,
        professionalType: type,
        bio: meta.bio,
        companyName: `${fullName.split(" ")[1]} ${meta.company}`,
        yearsExperience: years,
        serviceRegions: [loc.region, pick(locations, i * 2 + 1).region],
        baseLocation: loc.town,
        latitude: loc.lat,
        longitude: loc.lng,
        licenseNumber: `${type.slice(0, 3)}-${2000 + (i % 20)}-${1000 + i}`,
        licenseBody: meta.body,
        licenseStatus: i % 3 === 0 ? "VERIFIED" : i % 3 === 1 ? "PENDING" : "UNVERIFIED",
        isActive: true,
        services: {
          create: meta.services.map((title, s) => ({
            title,
            description: `${title} delivered by an experienced ${type.toLowerCase()}.`,
            priceGhs: BigInt(500 + s * 750 + (i % 5) * 200),
            priceModel: "FIXED",
            turnaroundDays: 3 + s * 4,
            isPublished: true,
          })),
        },
      },
    });
    proCount++;
    if (proCount % 10 === 0) console.log(`  ...${proCount} professionals created`);
    void profile;
  }
  console.log(`Created ${proCount} demo professionals with avatars & services.`);

  console.log("Demo seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

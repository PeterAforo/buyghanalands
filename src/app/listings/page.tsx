import { prisma } from "@/lib/db";
import { ListingsClient } from "./listings-client";

export const dynamic = 'force-dynamic';

async function getListings() {
  try {
    const listings = await prisma.listing.findMany({
      where: {
        status: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        description: true,
        region: true,
        district: true,
        town: true,
        landType: true,
        tenureType: true,
        sizeAcres: true,
        priceGhs: true,
        negotiable: true,
        verificationLevel: true,
        seller: {
          select: {
            id: true,
            fullName: true,
            kycTier: true,
          },
        },
        media: {
          take: 1,
          orderBy: { sortOrder: "asc" },
          select: {
            url: true,
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 20,
    });

    return listings;
  } catch (error) {
    console.error("Error fetching listings:", error);
    return [];
  }
}

async function getFilterOptions() {
  try {
    const [regions, constituencies, districts, landTypes] = await Promise.all([
      prisma.listing.findMany({
        where: { status: "PUBLISHED" },
        select: { region: true },
        distinct: ["region"],
      }),
      prisma.listing.findMany({
        where: { status: "PUBLISHED" },
        select: { constituency: true },
        distinct: ["constituency"],
      }),
      prisma.listing.findMany({
        where: { status: "PUBLISHED" },
        select: { district: true },
        distinct: ["district"],
      }),
      prisma.listing.findMany({
        where: { status: "PUBLISHED" },
        select: { landType: true },
        distinct: ["landType"],
      }),
    ]);

    return {
      regions: regions.map((r) => r.region),
      constituencies: constituencies.map((c) => c.constituency).filter((c): c is string => c !== null),
      districts: districts.map((d) => d.district),
      landTypes: landTypes.map((l) => l.landType),
    };
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return { regions: [], constituencies: [], districts: [], landTypes: [] };
  }
}

export default async function ListingsPage() {
  const [listings, filterOptions] = await Promise.all([
    getListings(),
    getFilterOptions(),
  ]);

  // Serialize the listings for the client component
  // BigInt and Decimal types cannot be serialized to JSON directly
  const serializedListings = listings.map((listing) => ({
    id: listing.id,
    title: listing.title,
    description: listing.description,
    region: listing.region,
    district: listing.district,
    town: listing.town,
    landType: listing.landType,
    tenureType: listing.tenureType,
    sizeAcres: listing.sizeAcres.toString(),
    priceGhs: listing.priceGhs.toString(),
    negotiable: listing.negotiable,
    verificationLevel: listing.verificationLevel,
    media: listing.media,
    seller: listing.seller,
  }));

  return (
    <ListingsClient
      initialListings={serializedListings}
      regions={filterOptions.regions}
      constituencies={filterOptions.constituencies}
      districts={filterOptions.districts}
      landTypes={filterOptions.landTypes}
    />
  );
}

import { prisma } from "@/lib/db";
import { ListingsClient } from "./listings-client";

export const dynamic = 'force-dynamic';

async function getListings() {
  const listings = await prisma.listing.findMany({
    where: {
      status: "PUBLISHED",
    },
    include: {
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
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 20,
  });

  return listings;
}

async function getFilterOptions() {
  const [regions, landTypes] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "PUBLISHED" },
      select: { region: true },
      distinct: ["region"],
    }),
    prisma.listing.findMany({
      where: { status: "PUBLISHED" },
      select: { landType: true },
      distinct: ["landType"],
    }),
  ]);

  return {
    regions: regions.map((r) => r.region),
    landTypes: landTypes.map((l) => l.landType),
  };
}

export default async function ListingsPage() {
  const [listings, filterOptions] = await Promise.all([
    getListings(),
    getFilterOptions(),
  ]);

  // Serialize the listings for the client component
  // BigInt and Decimal types cannot be serialized to JSON directly
  // Must explicitly map each field to avoid passing non-serializable types
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
    media: listing.media.map((m) => ({ url: m.url })),
    seller: {
      id: listing.seller.id,
      fullName: listing.seller.fullName,
      kycTier: listing.seller.kycTier,
    },
  }));

  return (
    <ListingsClient
      initialListings={serializedListings}
      regions={filterOptions.regions}
      landTypes={filterOptions.landTypes}
    />
  );
}

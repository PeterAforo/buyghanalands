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
  const serializedListings = listings.map((listing) => ({
    ...listing,
    sizeAcres: listing.sizeAcres.toString(),
    priceGhs: listing.priceGhs.toString(),
  }));

  return (
    <ListingsClient
      initialListings={serializedListings}
      regions={filterOptions.regions}
      landTypes={filterOptions.landTypes}
    />
  );
}

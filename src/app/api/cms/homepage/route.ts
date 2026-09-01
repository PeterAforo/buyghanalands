import { NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

export async function GET() {
  try {
    const [
      heroContent,
      stats,
      steps,
      landTypes,
      professionals,
      regions,
      testimonials,
      trustBarItems,
      featuredListings,
    ] = await withDbRetry(() =>
      Promise.all([
        prisma.heroContent.findFirst({ where: { isActive: true } }),
        prisma.homepageStat.findMany({
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
        }),
        prisma.homepageStep.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        }),
        prisma.homepageLandType.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        }),
        prisma.homepageProfessional.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        }),
        prisma.homepageRegion.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        }),
        prisma.testimonial.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        }),
        prisma.trustBarItem.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        }),
        prisma.listing.findMany({
          where: {
            status: "PUBLISHED",
            featuredListings: {
              some: { status: "ACTIVE" },
            },
          },
          take: 9,
          orderBy: { publishedAt: "desc" },
          select: {
            id: true,
            title: true,
            priceGhs: true,
            region: true,
            district: true,
            town: true,
            sizeAcres: true,
            verificationLevel: true,
            media: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
          },
        }),
      ])
    );

    // If fewer than 9 featured listings, fill with verified published listings
    let listings = featuredListings;
    if (listings.length < 9) {
      const existingIds = listings.map((l) => l.id);
      const additional = await withDbRetry(() =>
        prisma.listing.findMany({
          where: {
            status: "PUBLISHED",
            verificationLevel: { in: ["LEVEL_2_PLATFORM_REVIEWED", "LEVEL_3_OFFICIAL_VERIFIED"] },
            ...(existingIds.length > 0 ? { id: { notIn: existingIds } } : {}),
          },
          take: 9 - listings.length,
          orderBy: { publishedAt: "desc" },
          select: {
            id: true,
            title: true,
            priceGhs: true,
            region: true,
            district: true,
            town: true,
            sizeAcres: true,
            verificationLevel: true,
            media: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
          },
        })
      );
      listings = [...listings, ...additional];
    }
    // If still fewer than 9, fill with any published listings
    if (listings.length < 9) {
      const existingIds = listings.map((l) => l.id);
      const additional = await withDbRetry(() =>
        prisma.listing.findMany({
          where: {
            status: "PUBLISHED",
            ...(existingIds.length > 0 ? { id: { notIn: existingIds } } : {}),
          },
          take: 9 - listings.length,
          orderBy: { publishedAt: "desc" },
          select: {
            id: true,
            title: true,
            priceGhs: true,
            region: true,
            district: true,
            town: true,
            sizeAcres: true,
            verificationLevel: true,
            media: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
          },
        })
      );
      listings = [...listings, ...additional];
    }

    return NextResponse.json(
      serializeForJson({
        heroContent,
        stats,
        steps,
        landTypes,
        professionals,
        regions,
        testimonials,
        trustBarItems,
        featuredListings: listings.map((l) => ({
          id: l.id,
          title: l.title,
          price: l.priceGhs.toString(),
          location: [l.town, l.region].filter(Boolean).join(", "),
          size: l.sizeAcres.toString(),
          image: l.media[0]?.url || null,
          verified: ["LEVEL_2_PLATFORM_REVIEWED", "LEVEL_3_OFFICIAL_VERIFIED"].includes(l.verificationLevel),
        })),
      })
    );
  } catch (error) {
    console.error("Error fetching homepage CMS content:", error);
    return NextResponse.json(
      { error: "Failed to fetch homepage content" },
      { status: 500 }
    );
  }
}

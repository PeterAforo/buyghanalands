import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";
import { HomepageClient } from "@/components/home/homepage-client";

export const dynamic = "force-dynamic";

async function getHomepageData() {
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

  // Parse heroContent backgroundImages JSON
  let heroImages: string[] = [];
  if (heroContent?.backgroundImages) {
    try {
      const parsed = typeof heroContent.backgroundImages === "string"
        ? JSON.parse(heroContent.backgroundImages)
        : heroContent.backgroundImages;
      heroImages = Array.isArray(parsed) ? parsed : [];
    } catch {
      heroImages = [];
    }
  }

  return serializeForJson({
    heroContent: heroContent
      ? {
          eyebrow: heroContent.eyebrow,
          headline: heroContent.headline,
          subheadline: heroContent.subheadline,
          backgroundImages: heroImages,
        }
      : null,
    stats: stats.map((s) => ({
      id: s.id,
      label: s.label,
      value: s.value,
      prefix: s.prefix,
      suffix: s.suffix,
      icon: s.icon,
    })),
    steps: steps.map((s) => ({
      id: s.id,
      icon: s.icon,
      title: s.title,
      description: s.description,
    })),
    landTypes: landTypes.map((l) => ({
      id: l.id,
      type: l.type,
      label: l.label,
      icon: l.icon,
      count: l.count,
    })),
    professionals: professionals.map((p) => ({
      id: p.id,
      type: p.type,
      label: p.label,
      icon: p.icon,
      description: p.description,
    })),
    regions: regions.map((r) => ({
      id: r.id,
      name: r.name,
      count: r.count,
      image: r.image,
    })),
    testimonials: testimonials.map((t) => ({
      id: t.id,
      name: t.name,
      role: t.role,
      country: t.country,
      quote: t.quote,
      rating: t.rating,
    })),
    trustBarItems: trustBarItems.map((t) => ({
      id: t.id,
      icon: t.icon,
      label: t.label,
    })),
    featuredListings: listings.map((l) => ({
      id: l.id,
      title: l.title,
      price: l.priceGhs.toString(),
      location: [l.town, l.region].filter(Boolean).join(", "),
      size: l.sizeAcres.toString(),
      image: l.media[0]?.url || null,
      verified: ["LEVEL_2_PLATFORM_REVIEWED", "LEVEL_3_OFFICIAL_VERIFIED"].includes(l.verificationLevel),
    })),
  });
}

export default async function Home() {
  const data = await getHomepageData();

  return <HomepageClient data={data} />;
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: any = {
      status: "ACTIVE",
      endDate: { gt: new Date() },
      listing: {
        status: "PUBLISHED",
      },
    };

    if (region) {
      where.listing.region = region;
    }

    const featured = await prisma.featuredListing.findMany({
      where,
      include: {
        listing: {
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
        },
      },
      orderBy: [
        { priority: "desc" },
        { startDate: "desc" },
      ],
      take: limit,
    });

    const serialized = featured.map((f) => ({
      ...f,
      listing: {
        ...f.listing,
        priceGhs: f.listing.priceGhs.toString(),
        sizeAcres: f.listing.sizeAcres.toString(),
      },
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Error fetching featured listings:", error);
    return NextResponse.json({ error: "Failed to fetch featured listings" }, { status: 500 });
  }
}

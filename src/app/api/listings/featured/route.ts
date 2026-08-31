import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

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

    const featured = await withDbRetry(() => prisma.featuredListing.findMany({
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
    }));

    return NextResponse.json(serializeForJson(featured));
  } catch (error) {
    console.error("Error fetching featured listings:", error);
    return NextResponse.json({ error: "Failed to fetch featured listings" }, { status: 500 });
  }
}

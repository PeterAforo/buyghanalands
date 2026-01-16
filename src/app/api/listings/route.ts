import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createListingSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  region: z.string().min(1),
  district: z.string().min(1),
  town: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  landType: z.enum(["RESIDENTIAL", "COMMERCIAL", "AGRICULTURAL", "MIXED"]),
  tenureType: z.enum(["FREEHOLD", "LEASEHOLD", "CUSTOMARY"]),
  leaseDurationYears: z.number().nullable().optional(),
  sizeAcres: z.number(),
  sizePlots: z.number().nullable().optional(),
  priceGhs: z.number(),
  negotiable: z.boolean(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region");
    const landType = searchParams.get("landType");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const verified = searchParams.get("verified");

    const where: any = {
      status: "PUBLISHED",
    };

    if (region) where.region = region;
    if (landType) where.landType = landType;
    if (minPrice) where.priceGhs = { ...where.priceGhs, gte: parseInt(minPrice) };
    if (maxPrice) where.priceGhs = { ...where.priceGhs, lte: parseInt(maxPrice) };
    if (verified === "true") {
      where.verificationLevel = "LEVEL_3_OFFICIAL_VERIFIED";
    }

    const listings = await prisma.listing.findMany({
      where,
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
      take: 50,
    });

    return NextResponse.json(listings);
  } catch (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createListingSchema.parse(body);

    // Check if user has seller role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });

    if (!user?.roles.some((role) => ["SELLER", "AGENT", "ADMIN"].includes(role))) {
      // Add SELLER role if not present
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          roles: {
            push: "SELLER",
          },
        },
      });
    }

    const listing = await prisma.listing.create({
      data: {
        sellerId: session.user.id,
        title: data.title,
        description: data.description,
        region: data.region,
        district: data.district,
        town: data.town,
        latitude: data.latitude,
        longitude: data.longitude,
        landType: data.landType,
        tenureType: data.tenureType,
        leaseDurationYears: data.leaseDurationYears,
        sizeAcres: data.sizeAcres,
        sizePlots: data.sizePlots,
        priceGhs: data.priceGhs,
        negotiable: data.negotiable,
        status: "DRAFT",
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "LISTING",
        entityId: listing.id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "CREATE",
        diff: { created: data },
      },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating listing:", error);
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 }
    );
  }
}

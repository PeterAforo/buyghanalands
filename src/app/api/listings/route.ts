import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createListingSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  region: z.string().min(1),
  constituency: z.string().min(1),
  district: z.string().min(1),
  town: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  landType: z.enum(["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "AGRICULTURAL", "MIXED"]),
  categoryId: z.string().optional(),
  tenureType: z.enum(["FREEHOLD", "LEASEHOLD", "CUSTOMARY"]),
  leaseDurationYears: z.number().nullable().optional(),
  sizeAcres: z.number(),
  sizePlots: z.number().nullable().optional(),
  priceGhs: z.number(),
  negotiable: z.boolean(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || searchParams.get("q");
    const region = searchParams.get("region");
    const landType = searchParams.get("landType");
    const tenureType = searchParams.get("tenureType");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minSize = searchParams.get("minSize");
    const maxSize = searchParams.get("maxSize");
    const verificationLevel = searchParams.get("verificationLevel");
    const verified = searchParams.get("verified") === "true";
    const sortBy = searchParams.get("sortBy") || "newest";
    const mine = searchParams.get("mine") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {};

    // If fetching user's own listings
    if (mine && session?.user?.id) {
      where.sellerId = session.user.id;
    } else {
      where.status = "PUBLISHED";
    }

    // Text search
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { region: { contains: search, mode: "insensitive" } },
        { district: { contains: search, mode: "insensitive" } },
        { town: { contains: search, mode: "insensitive" } },
      ];
    }

    if (region) where.region = region;
    if (landType) where.landType = landType;
    if (tenureType) where.tenureType = tenureType;
    if (minPrice) where.priceGhs = { ...where.priceGhs, gte: parseInt(minPrice) };
    if (maxPrice) where.priceGhs = { ...where.priceGhs, lte: parseInt(maxPrice) };
    if (minSize) where.sizeAcres = { ...where.sizeAcres, gte: parseFloat(minSize) };
    if (maxSize) where.sizeAcres = { ...where.sizeAcres, lte: parseFloat(maxSize) };
    if (verificationLevel) where.verificationLevel = verificationLevel;
    if (verified) {
      where.verificationLevel = { in: ["LEVEL_2_PLATFORM_REVIEWED", "LEVEL_3_OFFICIAL_VERIFIED"] };
    }

    // Sorting
    let orderBy: any = { publishedAt: "desc" };
    switch (sortBy) {
      case "oldest":
        orderBy = { publishedAt: "asc" };
        break;
      case "price_low":
        orderBy = { priceGhs: "asc" };
        break;
      case "price_high":
        orderBy = { priceGhs: "desc" };
        break;
      case "size_low":
        orderBy = { sizeAcres: "asc" };
        break;
      case "size_high":
        orderBy = { sizeAcres: "desc" };
        break;
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
        _count: {
          select: { offers: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // Serialize BigInt fields
    const serializedListings = listings.map((listing) => ({
      ...listing,
      priceGhs: listing.priceGhs.toString(),
      sizeAcres: listing.sizeAcres.toString(),
      latitude: listing.latitude?.toString() || null,
      longitude: listing.longitude?.toString() || null,
    }));

    return NextResponse.json({ listings: serializedListings, page, limit });
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
        constituency: data.constituency,
        district: data.district,
        town: data.town || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        landType: data.landType,
        categoryId: data.categoryId || null,
        tenureType: data.tenureType,
        leaseDurationYears: data.leaseDurationYears,
        sizeAcres: data.sizeAcres,
        totalPlots: data.sizePlots || 1,
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

    // Convert BigInt to string for JSON serialization
    const serializedListing = {
      ...listing,
      priceGhs: listing.priceGhs.toString(),
    };

    return NextResponse.json(serializedListing, { status: 201 });
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

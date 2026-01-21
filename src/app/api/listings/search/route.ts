import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Search parameters
    const q = searchParams.get("q") || searchParams.get("search");
    const region = searchParams.get("region");
    const district = searchParams.get("district");
    const landType = searchParams.get("landType");
    const tenureType = searchParams.get("tenureType");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minSize = searchParams.get("minSize");
    const maxSize = searchParams.get("maxSize");
    const verificationLevel = searchParams.get("verificationLevel");
    const verified = searchParams.get("verified") === "true";
    
    // Proximity search
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radiusKm = parseFloat(searchParams.get("radius") || "10");
    
    // Sorting and pagination
    const sortBy = searchParams.get("sortBy") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      status: "PUBLISHED",
    };

    // Text search
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { region: { contains: q, mode: "insensitive" } },
        { district: { contains: q, mode: "insensitive" } },
        { town: { contains: q, mode: "insensitive" } },
      ];
    }

    // Location filters
    if (region) where.region = region;
    if (district) where.district = district;
    
    // Type filters
    if (landType) where.landType = landType;
    if (tenureType) where.tenureType = tenureType;
    
    // Price range
    if (minPrice || maxPrice) {
      where.priceGhs = {};
      if (minPrice) where.priceGhs.gte = BigInt(minPrice);
      if (maxPrice) where.priceGhs.lte = BigInt(maxPrice);
    }
    
    // Size range
    if (minSize || maxSize) {
      where.sizeAcres = {};
      if (minSize) where.sizeAcres.gte = parseFloat(minSize);
      if (maxSize) where.sizeAcres.lte = parseFloat(maxSize);
    }
    
    // Verification filter
    if (verificationLevel) {
      where.verificationLevel = verificationLevel;
    }
    if (verified) {
      where.verificationLevel = { in: ["LEVEL_2_PLATFORM_REVIEWED", "LEVEL_3_OFFICIAL_VERIFIED"] };
    }

    // Proximity search using bounding box
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const latDelta = radiusKm / 111;
      const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

      where.latitude = {
        gte: latitude - latDelta,
        lte: latitude + latDelta,
      };
      where.longitude = {
        gte: longitude - lngDelta,
        lte: longitude + lngDelta,
      };
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

    // Execute queries in parallel
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
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
            take: 3,
            orderBy: { sortOrder: "asc" },
          },
          _count: {
            select: { offers: true, favorites: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    // Calculate distances if proximity search
    let serializedListings = listings.map((listing) => {
      const base = {
        ...listing,
        priceGhs: listing.priceGhs.toString(),
        sizeAcres: listing.sizeAcres.toString(),
        latitude: listing.latitude?.toString() || null,
        longitude: listing.longitude?.toString() || null,
      };

      if (lat && lng && listing.latitude && listing.longitude) {
        const lat1 = parseFloat(lat) * Math.PI / 180;
        const lat2 = Number(listing.latitude) * Math.PI / 180;
        const dLat = (Number(listing.latitude) - parseFloat(lat)) * Math.PI / 180;
        const dLng = (Number(listing.longitude) - parseFloat(lng)) * Math.PI / 180;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = 6371 * c;

        return { ...base, distanceKm: Math.round(distanceKm * 100) / 100 };
      }

      return base;
    });

    // Sort by distance if proximity search
    if (lat && lng && sortBy === "nearest") {
      serializedListings = serializedListings.sort((a: any, b: any) => 
        (a.distanceKm || 0) - (b.distanceKm || 0)
      );
    }

    return NextResponse.json({
      listings: serializedListings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + listings.length < total,
      },
      filters: {
        q,
        region,
        district,
        landType,
        tenureType,
        minPrice,
        maxPrice,
        minSize,
        maxSize,
        verified,
        sortBy,
      },
    });
  } catch (error) {
    console.error("Error searching listings:", error);
    return NextResponse.json({ error: "Failed to search listings" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const checkDuplicateSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  radiusKm: z.number().default(0.5),
  excludeListingId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = checkDuplicateSchema.parse(body);

    // Calculate bounding box for proximity search
    // 1 degree latitude ≈ 111km, 1 degree longitude varies by latitude
    const latDelta = data.radiusKm / 111;
    const lngDelta = data.radiusKm / (111 * Math.cos(data.latitude * Math.PI / 180));

    const minLat = data.latitude - latDelta;
    const maxLat = data.latitude + latDelta;
    const minLng = data.longitude - lngDelta;
    const maxLng = data.longitude + lngDelta;

    // Find nearby listings
    const nearbyListings = await prisma.listing.findMany({
      where: {
        id: data.excludeListingId ? { not: data.excludeListingId } : undefined,
        status: { in: ["PUBLISHED", "UNDER_REVIEW", "SUBMITTED"] },
        latitude: {
          gte: minLat,
          lte: maxLat,
        },
        longitude: {
          gte: minLng,
          lte: maxLng,
        },
      },
      select: {
        id: true,
        title: true,
        latitude: true,
        longitude: true,
        sizeAcres: true,
        priceGhs: true,
        status: true,
        seller: {
          select: { id: true, fullName: true },
        },
      },
      take: 10,
    });

    // Calculate actual distances using Haversine formula
    const potentialDuplicates = nearbyListings.map((listing) => {
      const lat1 = data.latitude * Math.PI / 180;
      const lat2 = Number(listing.latitude) * Math.PI / 180;
      const dLat = (Number(listing.latitude) - data.latitude) * Math.PI / 180;
      const dLng = (Number(listing.longitude) - data.longitude) * Math.PI / 180;

      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = 6371 * c;

      return {
        ...listing,
        latitude: listing.latitude?.toString(),
        longitude: listing.longitude?.toString(),
        sizeAcres: listing.sizeAcres.toString(),
        priceGhs: listing.priceGhs.toString(),
        distanceKm: Math.round(distanceKm * 1000) / 1000,
      };
    }).filter((l) => l.distanceKm <= data.radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return NextResponse.json({
      hasPotentialDuplicates: potentialDuplicates.length > 0,
      count: potentialDuplicates.length,
      listings: potentialDuplicates,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error checking duplicates:", error);
    return NextResponse.json({ error: "Failed to check duplicates" }, { status: 500 });
  }
}

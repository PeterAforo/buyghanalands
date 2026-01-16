import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const featureListingSchema = z.object({
  duration: z.enum(["7", "14", "30"]),
});

// Feature pricing
const FEATURE_PRICES = {
  "7": 30,
  "14": 50,
  "30": 80,
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = featureListingSchema.parse(body);

    // Verify listing ownership
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { sellerId: true, status: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (listing.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Only published listings can be featured" }, { status: 400 });
    }

    // Check if user has subscription with featured listings
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
    });

    const features = subscription?.features as any;
    const hasFreeFeature = features?.featuredListings > 0 || features?.featuredListings === -1;

    const durationDays = parseInt(data.duration);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    // Create featured listing record
    const featured = await prisma.featuredListing.create({
      data: {
        listingId: id,
        userId: session.user.id,
        startDate: new Date(),
        endDate,
        priceGhs: hasFreeFeature ? 0 : FEATURE_PRICES[data.duration],
        status: hasFreeFeature ? "ACTIVE" : "PENDING_PAYMENT",
      },
    });

    // Update subscription usage if free feature used
    if (hasFreeFeature && features?.featuredListings > 0) {
      await prisma.subscription.update({
        where: { id: subscription!.id },
        data: {
          features: {
            ...features,
            featuredListings: features.featuredListings - 1,
          },
        },
      });
    }

    return NextResponse.json({
      featured,
      paymentRequired: !hasFreeFeature,
      amount: hasFreeFeature ? 0 : FEATURE_PRICES[data.duration],
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error featuring listing:", error);
    return NextResponse.json({ error: "Failed to feature listing" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const featured = await prisma.featuredListing.findFirst({
      where: {
        listingId: id,
        status: "ACTIVE",
        endDate: { gt: new Date() },
      },
    });

    return NextResponse.json({
      isFeatured: !!featured,
      featured,
      prices: FEATURE_PRICES,
    });
  } catch (error) {
    console.error("Error checking featured status:", error);
    return NextResponse.json({ error: "Failed to check featured status" }, { status: 500 });
  }
}

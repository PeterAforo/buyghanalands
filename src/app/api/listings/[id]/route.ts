import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            kycTier: true,
          },
        },
        media: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Convert BigInt to string for JSON serialization
    const serializedListing = {
      ...listing,
      priceGhs: listing.priceGhs.toString(),
      sizeAcres: listing.sizeAcres.toString(),
      latitude: listing.latitude?.toString() || null,
      longitude: listing.longitude?.toString() || null,
    };

    return NextResponse.json(serializedListing);
  } catch (error) {
    console.error("Error fetching listing:", error);
    return NextResponse.json(
      { error: "Failed to fetch listing" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Check if user owns this listing
    const existingListing = await prisma.listing.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!existingListing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (existingListing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const listing = await prisma.listing.update({
      where: { id },
      data: body,
    });

    // Convert BigInt to string for JSON serialization
    const serializedListing = {
      ...listing,
      priceGhs: listing.priceGhs.toString(),
      sizeAcres: listing.sizeAcres.toString(),
      latitude: listing.latitude?.toString() || null,
      longitude: listing.longitude?.toString() || null,
    };

    return NextResponse.json(serializedListing);
  } catch (error) {
    console.error("Error updating listing:", error);
    return NextResponse.json(
      { error: "Failed to update listing" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if user owns this listing
    const existingListing = await prisma.listing.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!existingListing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (existingListing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.listing.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Listing deleted" });
  } catch (error) {
    console.error("Error deleting listing:", error);
    return NextResponse.json(
      { error: "Failed to delete listing" },
      { status: 500 }
    );
  }
}

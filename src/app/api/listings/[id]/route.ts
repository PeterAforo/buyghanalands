import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

const updateListingSchema = z.object({
  title: z.string().min(5).optional(),
  description: z.string().min(20).optional(),
  region: z.string().min(1).optional(),
  constituency: z.string().nullable().optional(),
  district: z.string().min(1).optional(),
  town: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  landType: z.enum(["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "AGRICULTURAL", "MIXED"]).optional(),
  categoryId: z.string().nullable().optional(),
  tenureType: z.enum(["FREEHOLD", "LEASEHOLD", "CUSTOMARY"]).optional(),
  leaseDurationYears: z.number().int().positive().nullable().optional(),
  sizeAcres: z.number().positive().optional(),
  totalPlots: z.number().int().positive().optional(),
  availablePlots: z.number().int().nonnegative().optional(),
  pricePerPlotGhs: z.number().nonnegative().nullable().optional(),
  priceGhs: z.number().nonnegative().optional(),
  negotiable: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const listing = await withDbRetry(() => prisma.listing.findUnique({
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
    }));

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json(serializeForJson(listing));
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
      return NextResponse.json({ 
        error: "Unauthorized",
        message: "Please log in again to continue"
      }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateListingSchema.parse(body);

    // Check if user owns this listing
    const existingListing = await withDbRetry(() => prisma.listing.findUnique({
      where: { id },
      select: { sellerId: true },
    }));

    if (!existingListing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (existingListing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const listing = await withDbRetry(() => prisma.listing.update({
      where: { id },
      data: data,
    }));

    return NextResponse.json(serializeForJson(listing));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
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
    const existingListing = await withDbRetry(() => prisma.listing.findUnique({
      where: { id },
      select: { sellerId: true },
    }));

    if (!existingListing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (existingListing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await withDbRetry(() => prisma.listing.delete({
      where: { id },
    }));

    return NextResponse.json({ message: "Listing deleted" });
  } catch (error) {
    console.error("Error deleting listing:", error);
    return NextResponse.json(
      { error: "Failed to delete listing" },
      { status: 500 }
    );
  }
}

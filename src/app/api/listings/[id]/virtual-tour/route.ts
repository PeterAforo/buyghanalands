import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createTourSchema = z.object({
  type: z.enum(["360_PHOTO", "VIDEO", "DRONE", "WALKTHROUGH"]),
  title: z.string().optional(),
  description: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tours = await prisma.virtualTour.findMany({
      where: { listingId: id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(tours);
  } catch (error) {
    console.error("Error fetching virtual tours:", error);
    return NextResponse.json({ error: "Failed to fetch virtual tours" }, { status: 500 });
  }
}

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

    // Verify listing ownership
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = {
      "360_PHOTO": ["image/jpeg", "image/png", "image/webp"],
      "VIDEO": ["video/mp4", "video/webm", "video/quicktime"],
      "DRONE": ["video/mp4", "video/webm"],
      "WALKTHROUGH": ["video/mp4", "video/webm"],
    };

    if (!allowedTypes[type as keyof typeof allowedTypes]?.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type for this tour type" }, { status: 400 });
    }

    // Upload to Vercel Blob
    const ext = file.name.split('.').pop() || 'bin';
    const filename = `virtual-tours/${id}/${type}-${Date.now()}.${ext}`;

    const blob = await put(filename, file, {
      access: "public",
    });

    // Get current max sort order
    const maxOrder = await prisma.virtualTour.aggregate({
      where: { listingId: id },
      _max: { sortOrder: true },
    });

    const tour = await prisma.virtualTour.create({
      data: {
        listingId: id,
        type,
        url: blob.url,
        thumbnailUrl: type.includes("VIDEO") || type.includes("DRONE") ? null : blob.url,
        title: title || null,
        description: description || null,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      },
    });

    return NextResponse.json(tour, { status: 201 });
  } catch (error) {
    console.error("Error creating virtual tour:", error);
    return NextResponse.json({ error: "Failed to create virtual tour" }, { status: 500 });
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
    const { searchParams } = new URL(request.url);
    const tourId = searchParams.get("tourId");

    if (!tourId) {
      return NextResponse.json({ error: "Tour ID required" }, { status: 400 });
    }

    // Verify listing ownership
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.virtualTour.delete({
      where: { id: tourId },
    });

    return NextResponse.json({ message: "Virtual tour deleted" });
  } catch (error) {
    console.error("Error deleting virtual tour:", error);
    return NextResponse.json({ error: "Failed to delete virtual tour" }, { status: 500 });
  }
}

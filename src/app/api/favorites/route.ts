import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const addFavoriteSchema = z.object({
  listingId: z.string().min(1),
});

// GET - Get user's favorites
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            region: true,
            district: true,
            town: true,
            landType: true,
            sizeAcres: true,
            priceGhs: true,
            verificationLevel: true,
            status: true,
            media: {
              take: 1,
              orderBy: { sortOrder: "asc" },
              select: { url: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize and filter out deleted/unpublished listings
    const serializedFavorites = favorites
      .filter((f) => f.listing.status === "PUBLISHED")
      .map((f) => ({
        id: f.id,
        listingId: f.listingId,
        createdAt: f.createdAt.toISOString(),
        listing: {
          ...f.listing,
          sizeAcres: f.listing.sizeAcres.toString(),
          priceGhs: f.listing.priceGhs.toString(),
        },
      }));

    return NextResponse.json(serializedFavorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
  }
}

// POST - Add to favorites
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { listingId } = addFavoriteSchema.parse(body);

    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, status: true },
    });

    if (!listing || listing.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Already in favorites" }, { status: 400 });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        listingId,
      },
    });

    return NextResponse.json({ id: favorite.id, listingId }, { status: 201 });
  } catch (error) {
    console.error("Error adding favorite:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
  }
}

// DELETE - Remove from favorites
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");

    if (!listingId) {
      return NextResponse.json({ error: "Listing ID required" }, { status: 400 });
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: session.user.id,
        listingId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
  }
}

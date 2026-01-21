import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        listing: {
          include: {
            seller: {
              select: { id: true, fullName: true, kycTier: true },
            },
            media: {
              take: 1,
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      favorites.map((f) => ({
        ...f,
        listing: {
          ...f.listing,
          priceGhs: f.listing.priceGhs.toString(),
          sizeAcres: f.listing.sizeAcres.toString(),
          latitude: f.listing.latitude?.toString() || null,
          longitude: f.listing.longitude?.toString() || null,
        },
      }))
    );
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
  }
}

const addFavoriteSchema = z.object({
  listingId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = addFavoriteSchema.parse(body);

    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: data.listingId },
      select: { id: true, status: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId: data.listingId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Already in favorites" }, { status: 400 });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        listingId: data.listingId,
      },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error adding favorite:", error);
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");

    if (!listingId) {
      return NextResponse.json({ error: "listingId is required" }, { status: 400 });
    }

    await prisma.favorite.delete({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId,
        },
      },
    });

    return NextResponse.json({ message: "Removed from favorites" });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
  }
}

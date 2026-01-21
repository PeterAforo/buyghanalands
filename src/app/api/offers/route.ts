import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addDays } from "date-fns";
import { notifyOfferReceived } from "@/lib/notifications";

const createOfferSchema = z.object({
  listingId: z.string().min(1),
  amountGhs: z.number().positive(),
  message: z.string().optional(),
  expiresInDays: z.number().min(1).max(30).default(7),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      console.log("Offers API: Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Offers API: Received body:", JSON.stringify(body));
    const data = createOfferSchema.parse(body);

    // Check if listing exists and is published
    const listing = await prisma.listing.findUnique({
      where: { id: data.listingId },
      select: { id: true, status: true, sellerId: true, priceGhs: true },
    });

    if (!listing) {
      console.log("Offers API: Listing not found:", data.listingId);
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.status !== "PUBLISHED") {
      console.log("Offers API: Listing not published, status:", listing.status);
      return NextResponse.json(
        { error: "Listing is not available" },
        { status: 400 }
      );
    }

    if (listing.sellerId === session.user.id) {
      console.log("Offers API: User trying to offer on own listing");
      return NextResponse.json(
        { error: "Cannot make offer on your own listing" },
        { status: 400 }
      );
    }

    // Check for existing pending offer
    const existingOffer = await prisma.offer.findFirst({
      where: {
        listingId: data.listingId,
        buyerId: session.user.id,
        status: "SENT",
      },
    });

    if (existingOffer) {
      console.log("Offers API: User already has pending offer");
      return NextResponse.json(
        { error: "You already have a pending offer on this listing" },
        { status: 400 }
      );
    }

    const offer = await prisma.offer.create({
      data: {
        listingId: data.listingId,
        buyerId: session.user.id,
        amountGhs: BigInt(Math.round(data.amountGhs)),
        message: data.message,
        expiresAt: addDays(new Date(), data.expiresInDays),
        status: "SENT",
      },
      include: {
        listing: {
          select: { title: true, sellerId: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "OFFER",
        entityId: offer.id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "CREATE",
        diff: { amountGhs: data.amountGhs, listingId: data.listingId },
      },
    });

    // Send notification to seller (async, don't block response)
    notifyOfferReceived(offer.listing.sellerId, offer.listing.title, data.amountGhs).catch(console.error);

    // Serialize BigInt for JSON response
    return NextResponse.json({
      ...offer,
      amountGhs: offer.amountGhs.toString(),
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Zod validation error:", JSON.stringify(error.issues));
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating offer:", error);
    return NextResponse.json(
      { error: "Failed to create offer" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "sent" or "received"

    const where =
      type === "sent"
        ? { buyerId: session.user.id }
        : { listing: { sellerId: session.user.id } };

    const offers = await prisma.offer.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            priceGhs: true,
            town: true,
            district: true,
          },
        },
        buyer: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(offers);
  } catch (error) {
    console.error("Error fetching offers:", error);
    return NextResponse.json(
      { error: "Failed to fetch offers" },
      { status: 500 }
    );
  }
}

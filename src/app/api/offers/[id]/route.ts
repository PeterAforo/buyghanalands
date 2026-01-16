import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            seller: { select: { id: true, fullName: true, phone: true } },
          },
        },
        buyer: { select: { id: true, fullName: true, phone: true } },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    // Check authorization
    if (offer.buyerId !== session.user.id && offer.listing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      ...offer,
      amountGhs: offer.amountGhs.toString(),
    });
  } catch (error) {
    console.error("Error fetching offer:", error);
    return NextResponse.json({ error: "Failed to fetch offer" }, { status: 500 });
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

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        listing: { select: { sellerId: true, title: true } },
        buyer: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    // Only seller can accept/counter/reject, only buyer can withdraw
    const isSeller = offer.listing.sellerId === session.user.id;
    const isBuyer = offer.buyerId === session.user.id;

    if (!isSeller && !isBuyer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status, counterAmount } = body;

    // Validate status transitions
    if (status === "ACCEPTED" || status === "COUNTERED") {
      if (!isSeller) {
        return NextResponse.json({ error: "Only seller can accept or counter" }, { status: 403 });
      }
    }

    if (status === "WITHDRAWN" && !isBuyer && !isSeller) {
      return NextResponse.json({ error: "Cannot withdraw this offer" }, { status: 403 });
    }

    const updateData: any = { status };
    
    if (status === "COUNTERED" && counterAmount) {
      updateData.amountGhs = counterAmount;
    }

    if (status === "ACCEPTED") {
      // Create a transaction when offer is accepted
      await prisma.transaction.create({
        data: {
          offerId: offer.id,
          listingId: offer.listingId,
          buyerId: offer.buyerId,
          sellerId: offer.listing.sellerId,
          agreedPriceGhs: offer.amountGhs,
          status: "CREATED",
        },
      });
    }

    const updatedOffer = await prisma.offer.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...updatedOffer,
      amountGhs: updatedOffer.amountGhs.toString(),
    });
  } catch (error) {
    console.error("Error updating offer:", error);
    return NextResponse.json({ error: "Failed to update offer" }, { status: 500 });
  }
}

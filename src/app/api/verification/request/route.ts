import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmail, getVerificationStatusEmailHtml } from "@/lib/email";
import { z } from "zod";

const verificationRequestSchema = z.object({
  listingId: z.string().min(1),
  documentIds: z.array(z.string()).min(1, "At least one document required"),
  notes: z.string().optional(),
});

// POST - Create verification request
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = verificationRequestSchema.parse(body);

    // Verify listing ownership
    const listing = await prisma.listing.findFirst({
      where: {
        id: data.listingId,
        sellerId: session.user.id,
      },
      include: {
        seller: { select: { email: true, fullName: true } },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Check if there's already a pending request
    const existingRequest = await prisma.verificationRequest.findFirst({
      where: {
        listingId: data.listingId,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "A verification request is already pending for this listing" },
        { status: 400 }
      );
    }

    // Verify documents exist and belong to listing
    const documents = await prisma.document.findMany({
      where: {
        id: { in: data.documentIds },
        listingId: data.listingId,
      },
    });

    if (documents.length !== data.documentIds.length) {
      return NextResponse.json(
        { error: "Some documents were not found" },
        { status: 400 }
      );
    }

    // Create verification request
    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        listingId: data.listingId,
        userId: session.user.id,
        status: "PENDING",
        notes: data.notes,
        documentIds: data.documentIds,
      },
    });

    // Send confirmation email
    if (listing.seller.email) {
      await sendEmail({
        to: listing.seller.email,
        subject: "Verification Request Received - BuyGhanaLands",
        html: getVerificationStatusEmailHtml("submitted", listing.title),
      });
    }

    return NextResponse.json({
      id: verificationRequest.id,
      status: verificationRequest.status,
      message: "Verification request submitted successfully",
    }, { status: 201 });
  } catch (error) {
    console.error("Verification request error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to submit verification request" }, { status: 500 });
  }
}

// GET - Get verification requests for user's listings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");

    const where: any = {
      listing: {
        sellerId: session.user.id,
      },
    };

    if (listingId) {
      where.listingId = listingId;
    }

    const requests = await prisma.verificationRequest.findMany({
      where,
      include: {
        listing: {
          select: { id: true, title: true },
        },
        reviewer: {
          select: { fullName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serialized = requests.map((r) => ({
      id: r.id,
      listingId: r.listingId,
      listingTitle: r.listing.title,
      status: r.status,
      notes: r.notes,
      reviewerNotes: r.reviewerNotes,
      reviewerName: r.reviewer?.fullName,
      createdAt: r.createdAt.toISOString(),
      reviewedAt: r.reviewedAt?.toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Error fetching verification requests:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

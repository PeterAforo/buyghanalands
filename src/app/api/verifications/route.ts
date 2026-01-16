import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createVerificationSchema = z.object({
  listingId: z.string().min(1),
  levelRequested: z.enum([
    "LEVEL_1_DOCS_UPLOADED",
    "LEVEL_2_PLATFORM_REVIEWED",
    "LEVEL_3_OFFICIAL_VERIFIED",
  ]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createVerificationSchema.parse(body);

    // Check if listing exists and belongs to user
    const listing = await prisma.listing.findUnique({
      where: { id: data.listingId },
      select: { id: true, sellerId: true, verificationLevel: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only request verification for your own listings" },
        { status: 403 }
      );
    }

    // Check for existing pending request
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

    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        userId: session.user.id,
        listingId: data.listingId,
        levelRequested: data.levelRequested,
        status: "PENDING",
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "VERIFICATION_REQUEST",
        entityId: verificationRequest.id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "CREATE",
        diff: { levelRequested: data.levelRequested },
      },
    });

    return NextResponse.json(verificationRequest, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating verification request:", error);
    return NextResponse.json(
      { error: "Failed to create verification request" },
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
    const listingId = searchParams.get("listingId");

    const where: any = { userId: session.user.id };
    if (listingId) where.listingId = listingId;

    const requests = await prisma.verificationRequest.findMany({
      where,
      include: {
        listing: {
          select: { id: true, title: true, town: true, district: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching verification requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch verification requests" },
      { status: 500 }
    );
  }
}

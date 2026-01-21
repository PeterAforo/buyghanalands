import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
          select: { id: true, title: true, status: true },
        },
        assignedTo: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching verification requests:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

const createVerificationSchema = z.object({
  listingId: z.string(),
  levelRequested: z.enum([
    "LEVEL_1_DOCS_UPLOADED",
    "LEVEL_2_PLATFORM_REVIEWED",
    "LEVEL_3_OFFICIAL_VERIFIED",
  ]),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createVerificationSchema.parse(body);

    // Verify listing ownership
    const listing = await prisma.listing.findUnique({
      where: { id: data.listingId },
      select: { sellerId: true, verificationLevel: true, status: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    // Create verification request with default checklist
    const checklist = getVerificationChecklist(data.levelRequested);

    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        userId: session.user.id,
        listingId: data.listingId,
        levelRequested: data.levelRequested,
        status: "PENDING",
        checklist,
      },
      include: {
        listing: { select: { id: true, title: true } },
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
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}

function getVerificationChecklist(level: string) {
  const baseChecklist = [
    { id: "docs_complete", label: "All required documents uploaded", checked: false },
    { id: "docs_readable", label: "Documents are clear and readable", checked: false },
    { id: "info_consistent", label: "Information is consistent across documents", checked: false },
  ];

  if (level === "LEVEL_1_DOCS_UPLOADED") {
    return baseChecklist;
  }

  const platformChecklist = [
    ...baseChecklist,
    { id: "seller_verified", label: "Seller identity verified", checked: false },
    { id: "location_verified", label: "Location coordinates verified", checked: false },
    { id: "no_duplicates", label: "No duplicate listings detected", checked: false },
    { id: "price_reasonable", label: "Price is within market range", checked: false },
    { id: "no_fraud_flags", label: "No fraud indicators detected", checked: false },
  ];

  if (level === "LEVEL_2_PLATFORM_REVIEWED") {
    return platformChecklist;
  }

  // LEVEL_3_OFFICIAL_VERIFIED
  return [
    ...platformChecklist,
    { id: "lc_search", label: "Lands Commission search completed", checked: false },
    { id: "title_valid", label: "Title/deed validated", checked: false },
    { id: "encumbrance_check", label: "No encumbrances found", checked: false },
    { id: "boundary_survey", label: "Boundary survey verified", checked: false },
    { id: "legal_review", label: "Legal review completed", checked: false },
  ];
}

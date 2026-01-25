import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.some((role) => ["ADMIN", "SUPPORT", "MODERATOR"].includes(role)) || false;
}

const updateListingSchema = z.object({
  title: z.string().min(5).optional(),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "UNDER_REVIEW", "PUBLISHED", "SUSPENDED", "REJECTED", "SOLD"]).optional(),
  verificationLevel: z.enum(["NONE", "BASIC", "VERIFIED", "PREMIUM"]).optional(),
  isFeatured: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    type ListingStatusType = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "PUBLISHED" | "SUSPENDED" | "REJECTED" | "SOLD";
    let newStatus: ListingStatusType;

    switch (action) {
      case "approve":
        newStatus = "PUBLISHED";
        break;
      case "reject":
        newStatus = "REJECTED";
        break;
      case "suspend":
        newStatus = "SUSPENDED";
        break;
      case "reinstate":
        newStatus = "PUBLISHED";
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        status: newStatus,
        publishedAt: newStatus === "PUBLISHED" ? new Date() : listing.publishedAt,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "LISTING",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: `MODERATION_${action.toUpperCase()}`,
        diff: { from: listing.status, to: newStatus },
      },
    });

    return NextResponse.json({
      ...updatedListing,
      priceGhs: updatedListing.priceGhs.toString(),
      sizeAcres: updatedListing.sizeAcres.toString(),
    });
  } catch (error) {
    console.error("Error moderating listing:", error);
    return NextResponse.json({ error: "Failed to moderate listing" }, { status: 500 });
  }
}

// Get single listing details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            kycTier: true,
            accountStatus: true,
          },
        },
        media: true,
        documents: true,
        _count: {
          select: {
            offers: true,
            transactions: true,
            views: true,
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...listing,
      priceGhs: listing.priceGhs.toString(),
      sizeAcres: listing.sizeAcres.toString(),
    });
  } catch (error) {
    console.error("Error fetching listing:", error);
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
}

// Update listing details (PATCH)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateListingSchema.parse(body);

    const existingListing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!existingListing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (validatedData.title) updateData.title = validatedData.title;
    if (validatedData.description) updateData.description = validatedData.description;
    if (validatedData.status) {
      updateData.status = validatedData.status;
      if (validatedData.status === "PUBLISHED" && !existingListing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
    if (validatedData.verificationLevel) updateData.verificationLevel = validatedData.verificationLevel;
    if (validatedData.isFeatured !== undefined) updateData.isFeatured = validatedData.isFeatured;

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "LISTING",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "LISTING_UPDATED_BY_ADMIN",
        diff: { before: existingListing, changes: validatedData },
      },
    });

    return NextResponse.json({
      ...updatedListing,
      priceGhs: updatedListing.priceGhs.toString(),
      sizeAcres: updatedListing.sizeAcres.toString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error updating listing:", error);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}

// Delete listing (soft delete - set to SUSPENDED)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Soft delete - set status to SUSPENDED
    await prisma.listing.update({
      where: { id },
      data: { status: "SUSPENDED" },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "LISTING",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "LISTING_DELETED_BY_ADMIN",
        diff: { deletedListing: listing.title },
      },
    });

    return NextResponse.json({ success: true, message: "Listing suspended successfully" });
  } catch (error) {
    console.error("Error deleting listing:", error);
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }
}

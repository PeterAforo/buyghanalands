import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.some((role) => ["ADMIN", "SUPPORT", "MODERATOR"].includes(role)) || false;
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

    let newStatus: string;

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

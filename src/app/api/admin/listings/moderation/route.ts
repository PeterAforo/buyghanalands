import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function isModeratorOrAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.some((role) => ["ADMIN", "MODERATOR", "COMPLIANCE"].includes(role)) || false;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isModeratorOrAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "pending";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    let where: any = {};

    switch (filter) {
      case "pending":
        where.status = { in: ["SUBMITTED", "UNDER_REVIEW"] };
        break;
      case "rejected":
        where.status = "REJECTED";
        break;
      case "suspended":
        where.status = "SUSPENDED";
        break;
      case "all":
        break;
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              kycTier: true,
              accountStatus: true,
            },
          },
          media: { take: 1 },
          documents: { select: { id: true, type: true } },
          _count: {
            select: {
              reports: true,
              versions: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({
      listings: listings.map((l) => ({
        ...l,
        priceGhs: l.priceGhs.toString(),
        sizeAcres: l.sizeAcres.toString(),
        latitude: l.latitude?.toString(),
        longitude: l.longitude?.toString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching moderation queue:", error);
    return NextResponse.json({ error: "Failed to fetch moderation queue" }, { status: 500 });
  }
}

const moderateSchema = z.object({
  listingId: z.string(),
  action: z.enum(["approve", "reject", "suspend", "request_changes"]),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isModeratorOrAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data = moderateSchema.parse(body);

    const listing = await prisma.listing.findUnique({
      where: { id: data.listingId },
      select: { id: true, status: true, sellerId: true, title: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    let newStatus: string;
    switch (data.action) {
      case "approve":
        newStatus = "PUBLISHED";
        break;
      case "reject":
        newStatus = "REJECTED";
        break;
      case "suspend":
        newStatus = "SUSPENDED";
        break;
      case "request_changes":
        newStatus = "DRAFT";
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updatedListing = await prisma.listing.update({
      where: { id: data.listingId },
      data: {
        status: newStatus as any,
        publishedAt: newStatus === "PUBLISHED" ? new Date() : undefined,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "LISTING",
        entityId: data.listingId,
        actorType: "USER",
        actorUserId: session.user.id,
        action: `MODERATION_${data.action.toUpperCase()}`,
        diff: {
          previousStatus: listing.status,
          newStatus,
          reason: data.reason,
          notes: data.notes,
        },
      },
    });

    // TODO: Send notification to seller about moderation decision

    return NextResponse.json({
      message: `Listing ${data.action}ed successfully`,
      listing: {
        ...updatedListing,
        priceGhs: updatedListing.priceGhs.toString(),
        sizeAcres: updatedListing.sizeAcres.toString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error moderating listing:", error);
    return NextResponse.json({ error: "Failed to moderate listing" }, { status: 500 });
  }
}

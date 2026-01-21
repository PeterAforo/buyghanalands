import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Only seller or admin can view versions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });

    const isAdmin = user?.roles.some((r) => ["ADMIN", "MODERATOR"].includes(r));
    if (listing.sellerId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const versions = await prisma.listingVersion.findMany({
      where: { listingId: id },
      include: {
        createdBy: { select: { id: true, fullName: true } },
      },
      orderBy: { versionNumber: "desc" },
    });

    return NextResponse.json(
      versions.map((v) => ({
        ...v,
        priceGhs: v.priceGhs.toString(),
        sizeAcres: v.sizeAcres.toString(),
        latitude: v.latitude.toString(),
        longitude: v.longitude.toString(),
      }))
    );
  } catch (error) {
    console.error("Error fetching listing versions:", error);
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 });
  }
}

const updateListingSchema = z.object({
  title: z.string().min(5).optional(),
  description: z.string().min(20).optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  town: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  landType: z.enum(["RESIDENTIAL", "COMMERCIAL", "AGRICULTURAL", "MIXED"]).optional(),
  tenureType: z.enum(["FREEHOLD", "LEASEHOLD", "CUSTOMARY"]).optional(),
  leaseDurationYears: z.number().nullable().optional(),
  sizeAcres: z.number().optional(),
  sizePlots: z.number().nullable().optional(),
  priceGhs: z.number().optional(),
  negotiable: z.boolean().optional(),
});

export async function POST(
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
    const data = updateListingSchema.parse(body);

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only published listings create versions on edit
    if (listing.status !== "PUBLISHED") {
      // For non-published listings, just update directly
      const updated = await prisma.listing.update({
        where: { id },
        data: {
          ...data,
          priceGhs: data.priceGhs ? BigInt(data.priceGhs) : undefined,
        },
      });

      return NextResponse.json({
        ...updated,
        priceGhs: updated.priceGhs.toString(),
        sizeAcres: updated.sizeAcres.toString(),
      });
    }

    // For published listings, create a new version
    const nextVersionNumber = (listing.versions[0]?.versionNumber || 0) + 1;

    const newVersion = await prisma.listingVersion.create({
      data: {
        listingId: id,
        versionNumber: nextVersionNumber,
        status: "UNDER_REVIEW",
        title: data.title || listing.title,
        description: data.description || listing.description,
        region: data.region || listing.region,
        district: data.district || listing.district,
        town: data.town || listing.town || "",
        latitude: data.latitude || listing.latitude || 0,
        longitude: data.longitude || listing.longitude || 0,
        landType: data.landType || listing.landType,
        tenureType: data.tenureType || listing.tenureType,
        leaseDurationYears: data.leaseDurationYears ?? listing.leaseDurationYears,
        sizeAcres: data.sizeAcres || listing.sizeAcres,
        sizePlots: data.sizePlots ?? listing.sizePlots,
        priceGhs: data.priceGhs ? BigInt(data.priceGhs) : listing.priceGhs,
        negotiable: data.negotiable ?? listing.negotiable,
        createdById: session.user.id,
      },
    });

    // Update listing to point to new version and set to under review
    await prisma.listing.update({
      where: { id },
      data: {
        currentVersionId: newVersion.id,
        status: "UNDER_REVIEW",
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "LISTING_VERSION",
        entityId: newVersion.id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "CREATE_VERSION",
        diff: { versionNumber: nextVersionNumber, changes: data },
      },
    });

    return NextResponse.json({
      message: "New version created and submitted for review",
      version: {
        ...newVersion,
        priceGhs: newVersion.priceGhs.toString(),
        sizeAcres: newVersion.sizeAcres.toString(),
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating listing version:", error);
    return NextResponse.json({ error: "Failed to create version" }, { status: 500 });
  }
}

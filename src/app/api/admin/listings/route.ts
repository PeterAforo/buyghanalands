import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";
import { z } from "zod";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await withDbRetry(() => prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  }));
  return user?.roles.some((role) => ["ADMIN", "SUPPORT", "MODERATOR"].includes(role)) || false;
}

const bulkActionSchema = z.object({
  action: z.enum(["approve", "reject", "suspend", "delete"]),
  listingIds: z.array(z.string()).min(1, "At least one listing ID required"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "pending";
    const search = searchParams.get("search") || "";

    let where: any = {};

    switch (filter) {
      case "pending":
        where.status = { in: ["SUBMITTED", "UNDER_REVIEW"] };
        break;
      case "published":
        where.status = "PUBLISHED";
        break;
      case "suspended":
        where.status = "SUSPENDED";
        break;
      case "rejected":
        where.status = "REJECTED";
        break;
      case "all":
        break;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { region: { contains: search, mode: "insensitive" } },
        { district: { contains: search, mode: "insensitive" } },
        { seller: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const listings = await withDbRetry(() => prisma.listing.findMany({
      where,
      include: {
        seller: {
          select: { id: true, fullName: true, phone: true, kycTier: true },
        },
        media: { take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }));

    return NextResponse.json(
      listings.map((l) => ({
        ...l,
        priceGhs: l.priceGhs.toString(),
        sizeAcres: l.sizeAcres.toString(),
      }))
    );
  } catch (error) {
    console.error("Error fetching admin listings:", error);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}

// Bulk actions for listings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action, listingIds } = bulkActionSchema.parse(body);

    const statusMap: Record<string, string> = {
      approve: "PUBLISHED",
      reject: "REJECTED",
      suspend: "SUSPENDED",
      delete: "SUSPENDED", // Soft delete = suspend
    };

    const result = await withDbRetry(() => prisma.listing.updateMany({
      where: { id: { in: listingIds } },
      data: {
        status: statusMap[action] as any,
        publishedAt: action === "approve" ? new Date() : undefined,
      },
    }));

    // Create audit logs
    for (const listingId of listingIds) {
      await withDbRetry(() => prisma.auditLog.create({
        data: {
          entityType: "LISTING",
          entityId: listingId,
          actorType: "USER",
          actorUserId: session.user.id,
          action: `LISTING_BULK_${action.toUpperCase()}`,
          diff: { newStatus: statusMap[action] },
        },
      }));
    }

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error performing bulk action:", error);
    return NextResponse.json({ error: "Failed to perform bulk action" }, { status: 500 });
  }
}

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

    const listings = await prisma.listing.findMany({
      where,
      include: {
        seller: {
          select: { id: true, fullName: true, phone: true, kycTier: true },
        },
        media: { take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

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

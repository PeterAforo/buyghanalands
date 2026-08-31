import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await withDbRetry(() => prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  }));
  return user?.roles.some((role) => ["ADMIN", "MODERATOR"].includes(role)) || false;
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
    const filter = searchParams.get("filter") || "all";
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const where: any = {};
    if (type) where.professionalType = type;
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } },
        { user: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }
    switch (filter) {
      case "active": where.isActive = true; break;
      case "inactive": where.isActive = false; break;
      case "unverified": where.licenseStatus = "UNVERIFIED"; break;
      case "verified": where.licenseStatus = "VERIFIED"; break;
    }

    const [professionals, total, stats] = await withDbRetry(() => Promise.all([
      prisma.professionalProfile.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true, phone: true, accountStatus: true } },
          _count: { select: { services: true, bookings: true, reviewsReceived: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.professionalProfile.count({ where }),
      prisma.professionalProfile.groupBy({
        by: ["professionalType"],
        _count: true,
      }),
    ]));

    return NextResponse.json(serializeForJson({ professionals, total, stats }));
  } catch (error) {
    console.error("Error fetching professionals:", error);
    return NextResponse.json({ error: "Failed to fetch professionals" }, { status: 500 });
  }
}

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
    const filter = searchParams.get("filter") || "open";
    const search = searchParams.get("search") || "";

    let where: any = {};

    switch (filter) {
      case "open":
        where.status = "OPEN";
        break;
      case "review":
        where.status = "UNDER_REVIEW";
        break;
      case "resolved":
        where.status = { in: ["RESOLVED_BUYER", "RESOLVED_SELLER", "RESOLVED_SPLIT", "CLOSED"] };
        break;
      case "all":
        break;
    }

    if (search) {
      where.OR = [
        { summary: { contains: search, mode: "insensitive" } },
        { transaction: { listing: { title: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const disputes = await prisma.dispute.findMany({
      where,
      include: {
        raisedBy: { select: { id: true, fullName: true } },
        transaction: {
          include: {
            listing: { select: { id: true, title: true } },
            buyer: { select: { id: true, fullName: true } },
            seller: { select: { id: true, fullName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(
      disputes.map((d) => ({
        ...d,
        transaction: {
          ...d.transaction,
          agreedPriceGhs: d.transaction.agreedPriceGhs.toString(),
        },
      }))
    );
  } catch (error) {
    console.error("Error fetching admin disputes:", error);
    return NextResponse.json({ error: "Failed to fetch disputes" }, { status: 500 });
  }
}

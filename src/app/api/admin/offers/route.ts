import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await withDbRetry(() => prisma.user.findUnique({ where: { id: userId }, select: { roles: true } }));
  return user?.roles.some((r) => ["ADMIN", "MODERATOR"].includes(r)) || false;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await isAdmin(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status) where.status = status;

    const offers = await withDbRetry(() => prisma.offer.findMany({
      where,
      include: {
        buyer: { select: { id: true, fullName: true, phone: true } },
        listing: { select: { id: true, title: true, priceGhs: true, seller: { select: { fullName: true } } } },
        transaction: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }));

    return NextResponse.json(serializeForJson(offers));
  } catch (error) {
    console.error("Error fetching offers:", error);
    return NextResponse.json({ error: "Failed to fetch offers" }, { status: 500 });
  }
}

// PUT — update offer status (admin action: approve, reject, expire)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await isAdmin(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id, status } = await request.json();
    if (!id || !status) return NextResponse.json({ error: "id and status are required" }, { status: 400 });

    const validStatuses = ["PENDING", "ACCEPTED", "REJECTED", "EXPIRED", "WITHDRAWN"];
    if (!validStatuses.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    const offer = await withDbRetry(() => prisma.offer.update({
      where: { id },
      data: { status },
    }));

    await withDbRetry(() => prisma.auditLog.create({
      data: {
        entityType: "OFFER",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "UPDATE",
        diff: { status },
      },
    }));

    return NextResponse.json(serializeForJson(offer));
  } catch (error) {
    console.error("Error updating offer:", error);
    return NextResponse.json({ error: "Failed to update offer" }, { status: 500 });
  }
}

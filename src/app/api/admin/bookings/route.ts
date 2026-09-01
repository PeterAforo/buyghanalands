import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await withDbRetry(() => prisma.user.findUnique({ where: { id: userId }, select: { roles: true } }));
  return user?.roles.some((r) => ["ADMIN", "SUPPORT", "MODERATOR"].includes(r)) || false;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await isAdmin(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";

    const where: any = {};
    switch (filter) {
      case "requested": where.status = "REQUESTED"; break;
      case "in_progress": where.status = { in: ["SCHEDULED", "IN_PROGRESS"] }; break;
      case "delivered": where.status = "DELIVERED"; break;
      case "completed": where.status = "COMPLETED"; break;
      case "cancelled": where.status = { in: ["CANCELLED", "DECLINED"] }; break;
    }

    const bookings = await withDbRetry(() => prisma.booking.findMany({
      where,
      include: {
        serviceRequest: { select: { id: true, title: true, acceptedPriceGhs: true, requester: { select: { id: true, fullName: true, phone: true } } } },
        professional: { select: { id: true, professionalType: true, user: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }));

    return NextResponse.json(serializeForJson(bookings));
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

// PUT — update booking status (admin action)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await isAdmin(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id, status } = await request.json();
    if (!id || !status) return NextResponse.json({ error: "id and status are required" }, { status: 400 });

    const validStatuses = ["REQUESTED", "SCHEDULED", "IN_PROGRESS", "DELIVERED", "COMPLETED", "CANCELLED", "DECLINED"];
    if (!validStatuses.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    const booking = await withDbRetry(() => prisma.booking.update({
      where: { id },
      data: { status, ...(status === "COMPLETED" ? { completedAt: new Date() } : {}) },
    }));

    await withDbRetry(() => prisma.auditLog.create({
      data: {
        entityType: "BOOKING",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "UPDATE",
        diff: { status },
      },
    }));

    return NextResponse.json(serializeForJson(booking));
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}

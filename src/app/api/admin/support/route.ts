import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

async function isSupport(userId: string): Promise<boolean> {
  const user = await withDbRetry(() => prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  }));
  return user?.roles.some((role) => ["ADMIN", "SUPPORT"].includes(role)) || false;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isSupport(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "open";
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {};

    switch (filter) {
      case "open":
        where.status = "OPEN";
        break;
      case "in_progress":
        where.status = "IN_PROGRESS";
        break;
      case "waiting":
        where.status = "WAITING_USER";
        break;
      case "resolved":
        where.status = { in: ["RESOLVED", "CLOSED"] };
        break;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
        { user: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [tickets, total, stats] = await withDbRetry(() => Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true, phone: true } },
          transaction: {
            select: {
              id: true,
              status: true,
              listing: { select: { title: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]));

    const statusCounts = stats.reduce((acc, s) => {
      acc[s.status] = s._count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: statusCounts,
    });
  } catch (error) {
    console.error("Error fetching support tickets:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

// PUT — update ticket status (admin action)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await isSupport(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id, status, adminResponse } = await request.json();
    if (!id || !status) return NextResponse.json({ error: "id and status are required" }, { status: 400 });

    const validStatuses = ["OPEN", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"];
    if (!validStatuses.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    const ticket = await withDbRetry(() => prisma.supportTicket.update({
      where: { id },
      data: { status },
    }));

    await withDbRetry(() => prisma.auditLog.create({
      data: {
        entityType: "SUPPORT_TICKET",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "UPDATE",
        diff: { status, adminResponse },
      },
    }));

    return NextResponse.json(serializeForJson(ticket));
  } catch (error) {
    console.error("Error updating support ticket:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}

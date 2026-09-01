import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await withDbRetry(() => prisma.user.findUnique({ where: { id: userId }, select: { roles: true } }));
  return user?.roles.some((r) => ["ADMIN", "FINANCE"].includes(r)) || false;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await isAdmin(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";
    const category = searchParams.get("category");

    const where: any = {};
    if (category) where.category = category;
    switch (filter) {
      case "active": where.status = "ACTIVE"; break;
      case "cancelled": where.status = "CANCELLED"; break;
      case "expired": where.status = "EXPIRED"; break;
      case "past_due": where.status = "PAST_DUE"; break;
    }

    const [subscriptions, total, stats] = await withDbRetry(() => Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true, phone: true } },
          _count: { select: { payments: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.subscription.count({ where }),
      prisma.subscription.groupBy({ by: ["status"], _count: true }),
    ]));

    return NextResponse.json(serializeForJson({ subscriptions, total, stats }));
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }
}

// PUT — update subscription status (admin action)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await isAdmin(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id, status } = await request.json();
    if (!id || !status) return NextResponse.json({ error: "id and status are required" }, { status: 400 });

    const validStatuses = ["ACTIVE", "CANCELLED", "EXPIRED", "PAST_DUE", "TRIALING"];
    if (!validStatuses.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    const subscription = await withDbRetry(() => prisma.subscription.update({
      where: { id },
      data: { status },
    }));

    await withDbRetry(() => prisma.auditLog.create({
      data: {
        entityType: "SUBSCRIPTION",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "UPDATE",
        diff: { status },
      },
    }));

    return NextResponse.json(serializeForJson(subscription));
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}

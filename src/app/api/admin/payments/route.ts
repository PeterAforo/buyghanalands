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
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const provider = searchParams.get("provider");

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (provider) where.provider = provider;

    const [payments, total, stats] = await withDbRetry(() => Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          payerUser: { select: { id: true, fullName: true } },
          payeeUser: { select: { id: true, fullName: true } },
          transaction: { select: { id: true, listing: { select: { title: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.payment.count({ where }),
      prisma.payment.groupBy({ by: ["status"], _count: true }),
    ]));

    return NextResponse.json(serializeForJson({ payments, total, stats }));
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

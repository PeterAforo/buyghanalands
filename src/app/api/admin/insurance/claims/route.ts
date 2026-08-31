import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await withDbRetry(() => prisma.user.findUnique({ where: { id: userId }, select: { roles: true } }));
  return user?.roles.some((r) => ["ADMIN", "FINANCE", "COMPLIANCE"].includes(r)) || false;
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

    const claims = await withDbRetry(() => prisma.insuranceClaim.findMany({
      where,
      include: {
        insurance: {
          select: {
            id: true, coverageLevel: true, coverageAmountGhs: true, premiumGhs: true,
            transaction: { select: { id: true, listing: { select: { title: true } } } },
          },
        },
        claimant: { select: { id: true, fullName: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }));

    return NextResponse.json(serializeForJson(claims));
  } catch (error) {
    console.error("Error fetching insurance claims:", error);
    return NextResponse.json({ error: "Failed to fetch insurance claims" }, { status: 500 });
  }
}

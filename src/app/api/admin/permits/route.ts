import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });

    if (!user?.roles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const assemblyId = searchParams.get("assemblyId");

    const where: any = {};
    if (status) where.status = status;
    if (assemblyId) where.assemblyId = assemblyId;

    const permits = await prisma.permitApplication.findMany({
      where,
      include: {
        applicant: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
        assembly: {
          select: {
            id: true,
            name: true,
            region: true,
            district: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: { documents: true, queries: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serialized = permits.map((p) => ({
      ...p,
      estimatedCostGhs: p.estimatedCostGhs?.toString() || null,
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Error fetching permits:", error);
    return NextResponse.json({ error: "Failed to fetch permits" }, { status: 500 });
  }
}

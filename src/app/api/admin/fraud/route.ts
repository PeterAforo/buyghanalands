import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function isCompliance(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.some((role) => ["ADMIN", "COMPLIANCE", "MODERATOR"].includes(role)) || false;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isCompliance(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "open";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {};

    switch (filter) {
      case "open":
        where.status = "OPEN";
        break;
      case "investigating":
        where.status = "INVESTIGATING";
        break;
      case "actioned":
        where.status = "ACTION_TAKEN";
        break;
      case "closed":
        where.status = "CLOSED";
        break;
    }

    const [cases, total, stats] = await Promise.all([
      prisma.fraudCase.findMany({
        where,
        include: {
          openedBy: { select: { id: true, fullName: true } },
          listing: {
            select: {
              id: true,
              title: true,
              status: true,
              seller: { select: { id: true, fullName: true } },
            },
          },
          user: { select: { id: true, fullName: true, accountStatus: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.fraudCase.count({ where }),
      prisma.fraudCase.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    const statusCounts = stats.reduce((acc, s) => {
      acc[s.status] = s._count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      cases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: statusCounts,
    });
  } catch (error) {
    console.error("Error fetching fraud cases:", error);
    return NextResponse.json({ error: "Failed to fetch fraud cases" }, { status: 500 });
  }
}

const createFraudCaseSchema = z.object({
  listingId: z.string().optional(),
  userId: z.string().optional(),
  summary: z.string().min(10),
  evidence: z.any().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isCompliance(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data = createFraudCaseSchema.parse(body);

    if (!data.listingId && !data.userId) {
      return NextResponse.json(
        { error: "Either listingId or userId is required" },
        { status: 400 }
      );
    }

    const fraudCase = await prisma.fraudCase.create({
      data: {
        openedById: session.user.id,
        listingId: data.listingId,
        userId: data.userId,
        status: "OPEN",
        summary: data.summary,
        evidence: data.evidence,
      },
      include: {
        listing: { select: { id: true, title: true } },
        user: { select: { id: true, fullName: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "FRAUD_CASE",
        entityId: fraudCase.id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "CREATE",
        diff: { listingId: data.listingId, userId: data.userId },
      },
    });

    return NextResponse.json(fraudCase, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating fraud case:", error);
    return NextResponse.json({ error: "Failed to create fraud case" }, { status: 500 });
  }
}

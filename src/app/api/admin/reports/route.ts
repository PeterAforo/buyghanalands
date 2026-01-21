import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function isModerator(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.some((role) => ["ADMIN", "MODERATOR", "SUPPORT", "COMPLIANCE"].includes(role)) || false;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isModerator(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "open";
    const targetType = searchParams.get("targetType");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {};

    switch (filter) {
      case "open":
        where.status = "OPEN";
        break;
      case "in_review":
        where.status = "IN_REVIEW";
        break;
      case "actioned":
        where.status = "ACTIONED";
        break;
      case "dismissed":
        where.status = "DISMISSED";
        break;
    }

    if (targetType) {
      where.targetType = targetType;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, fullName: true } },
          listing: { select: { id: true, title: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    // Get report counts by target for prioritization
    const reportCounts = await prisma.report.groupBy({
      by: ["targetType", "targetId"],
      where: { status: { in: ["OPEN", "IN_REVIEW"] } },
      _count: true,
      orderBy: { _count: { targetId: "desc" } },
      take: 10,
    });

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      hotspots: reportCounts,
    });
  } catch (error) {
    console.error("Error fetching admin reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

const actionSchema = z.object({
  reportId: z.string(),
  action: z.enum(["review", "action", "dismiss"]),
  notes: z.string().optional(),
  suspendTarget: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isModerator(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data = actionSchema.parse(body);

    const report = await prisma.report.findUnique({
      where: { id: data.reportId },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    let newStatus: "IN_REVIEW" | "ACTIONED" | "DISMISSED";
    switch (data.action) {
      case "review":
        newStatus = "IN_REVIEW";
        break;
      case "action":
        newStatus = "ACTIONED";
        break;
      case "dismiss":
        newStatus = "DISMISSED";
        break;
    }

    await prisma.report.update({
      where: { id: data.reportId },
      data: { status: newStatus },
    });

    // If actioning and suspendTarget is true, suspend the target
    if (data.action === "action" && data.suspendTarget) {
      if (report.targetType === "LISTING") {
        await prisma.listing.update({
          where: { id: report.targetId },
          data: { status: "SUSPENDED" },
        });
      } else if (report.targetType === "USER") {
        await prisma.user.update({
          where: { id: report.targetId },
          data: { accountStatus: "SUSPENDED" },
        });
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "REPORT",
        entityId: data.reportId,
        actorType: "USER",
        actorUserId: session.user.id,
        action: `REPORT_${data.action.toUpperCase()}`,
        diff: {
          previousStatus: report.status,
          newStatus,
          notes: data.notes,
          suspendTarget: data.suspendTarget,
        },
      },
    });

    return NextResponse.json({
      message: `Report ${data.action}ed`,
      reportId: data.reportId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error processing report:", error);
    return NextResponse.json({ error: "Failed to process report" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function isCompliance(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.some((role) => ["ADMIN", "COMPLIANCE"].includes(role)) || false;
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
    const entityType = searchParams.get("entityType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const format = searchParams.get("format") || "json";

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const where: any = {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    if (entityType) where.entityType = entityType;

    // Limit export to 10,000 records
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        actorUser: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 10000,
    });

    // Log the export
    await prisma.auditLog.create({
      data: {
        entityType: "AUDIT_LOG" as any,
        entityId: "EXPORT",
        actorType: "USER",
        actorUserId: session.user.id,
        action: "EXPORT",
        diff: {
          startDate,
          endDate,
          entityType,
          recordCount: logs.length,
        },
      },
    });

    if (format === "csv") {
      // Generate CSV
      const headers = ["ID", "Entity Type", "Entity ID", "Actor Type", "Actor User ID", "Actor Name", "Action", "IP", "Created At"];
      const rows = logs.map((log) => [
        log.id,
        log.entityType,
        log.entityId,
        log.actorType,
        log.actorUserId || "",
        log.actorUser?.fullName || "SYSTEM",
        log.action,
        log.ip || "",
        log.createdAt.toISOString(),
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="audit-logs-${startDate}-${endDate}.csv"`,
        },
      });
    }

    // Default JSON format
    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      exportedBy: session.user.id,
      dateRange: { startDate, endDate },
      entityType: entityType || "ALL",
      recordCount: logs.length,
      logs: logs.map((log) => ({
        id: log.id,
        entityType: log.entityType,
        entityId: log.entityId,
        actorType: log.actorType,
        actorUserId: log.actorUserId,
        actorName: log.actorUser?.fullName || "SYSTEM",
        action: log.action,
        diff: log.diff,
        ip: log.ip,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error exporting audit logs:", error);
    return NextResponse.json({ error: "Failed to export audit logs" }, { status: 500 });
  }
}

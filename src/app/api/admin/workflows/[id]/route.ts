import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await withDbRetry(() => prisma.user.findUnique({ where: { id: userId }, select: { roles: true } }));
  return user?.roles.some((r) => ["ADMIN", "SUPPORT"].includes(r)) || false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await isAdmin(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const workflow = await withDbRetry(() => prisma.propertyWorkflow.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        listing: { select: { id: true, title: true, region: true, district: true, priceGhs: true } },
        landAcquisition: true,
        preConstruction: true,
        buildingPermit: true,
        construction: true,
        workflowDocuments: { orderBy: { createdAt: "desc" } },
        workflowNotes: { orderBy: { createdAt: "desc" } },
        workflowAlerts: { orderBy: { createdAt: "desc" } },
        costTracker: true,
      },
    }));

    if (!workflow) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    return NextResponse.json(serializeForJson(workflow));
  } catch (error) {
    console.error("Error fetching workflow:", error);
    return NextResponse.json({ error: "Failed to fetch workflow" }, { status: 500 });
  }
}

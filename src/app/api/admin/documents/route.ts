import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await withDbRetry(() => prisma.user.findUnique({ where: { id: userId }, select: { roles: true } }));
  return user?.roles.some((r) => ["ADMIN", "COMPLIANCE", "MODERATOR"].includes(r)) || false;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await isAdmin(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const accessPolicy = searchParams.get("accessPolicy");

    const where: any = {};
    if (type) where.type = type;
    if (accessPolicy) where.accessPolicy = accessPolicy;

    const documents = await withDbRetry(() => prisma.document.findMany({
      where,
      include: {
        owner: { select: { id: true, fullName: true } },
        listing: { select: { id: true, title: true } },
        transaction: { select: { id: true } },
        _count: { select: { accessLogs: true, verifications: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }));

    return NextResponse.json(serializeForJson(documents));
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

// PUT — update document verification status (admin action)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await isAdmin(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id, verificationStatus, note } = await request.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const data: any = {};
    if (verificationStatus) data.verificationStatus = verificationStatus;

    const document = await withDbRetry(() => prisma.document.update({
      where: { id },
      data,
    }));

    await withDbRetry(() => prisma.auditLog.create({
      data: {
        entityType: "DOCUMENT",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "UPDATE",
        diff: { verificationStatus, note },
      },
    }));

    return NextResponse.json(serializeForJson(document));
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

// DELETE — delete a document (admin action)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await isAdmin(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    await withDbRetry(() => prisma.document.delete({ where: { id } }));

    await withDbRetry(() => prisma.auditLog.create({
      data: {
        entityType: "DOCUMENT",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "DELETE",
        diff: {},
      },
    }));

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}

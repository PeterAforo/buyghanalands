import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await withDbRetry(() => prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  }));
  return user?.roles.some((role) => ["ADMIN", "MODERATOR"].includes(role)) || false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const professional = await withDbRetry(() => prisma.professionalProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true, accountStatus: true, kycTier: true, createdAt: true } },
        services: true,
        bookings: {
          include: {
            serviceRequest: { select: { id: true, title: true, acceptedPriceGhs: true, requester: { select: { fullName: true } } } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        reviewsReceived: {
          include: { reviewer: { select: { fullName: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: { select: { services: true, bookings: true, reviewsReceived: true } },
      },
    }));

    if (!professional) {
      return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    }

    return NextResponse.json(serializeForJson(professional));
  } catch (error) {
    console.error("Error fetching professional:", error);
    return NextResponse.json({ error: "Failed to fetch professional" }, { status: 500 });
  }
}

const updateSchema = z.object({
  isActive: z.boolean().optional(),
  licenseStatus: z.enum(["UNVERIFIED", "VERIFIED", "REJECTED"]).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const updated = await withDbRetry(() => prisma.professionalProfile.update({
      where: { id },
      data,
    }));

    await withDbRetry(() => prisma.auditLog.create({
      data: {
        entityType: "PROFESSIONAL_PROFILE",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "UPDATE",
        diff: data,
      },
    }));

    return NextResponse.json(serializeForJson(updated));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error updating professional:", error);
    return NextResponse.json({ error: "Failed to update professional" }, { status: 500 });
  }
}

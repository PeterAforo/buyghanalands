import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function isVerifier(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.some((role) => ["ADMIN", "MODERATOR", "COMPLIANCE"].includes(role)) || false;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isVerifier(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "pending";
    const assignedToMe = searchParams.get("assignedToMe") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {};

    switch (filter) {
      case "pending":
        where.status = "PENDING";
        break;
      case "in_progress":
        where.status = "PENDING";
        where.assignedToId = { not: null };
        break;
      case "completed":
        where.status = "COMPLETED";
        break;
      case "rejected":
        where.status = "REJECTED";
        break;
    }

    if (assignedToMe) {
      where.assignedToId = session.user.id;
    }

    const [requests, total] = await Promise.all([
      prisma.verificationRequest.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, phone: true, kycTier: true } },
          listing: {
            select: {
              id: true,
              title: true,
              region: true,
              district: true,
              priceGhs: true,
              verificationLevel: true,
              media: { take: 1 },
              documents: { select: { id: true, type: true } },
            },
          },
          assignedTo: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
      }),
      prisma.verificationRequest.count({ where }),
    ]);

    return NextResponse.json({
      requests: requests.map((r) => ({
        ...r,
        listing: r.listing ? {
          ...r.listing,
          priceGhs: r.listing.priceGhs.toString(),
        } : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching verification queue:", error);
    return NextResponse.json({ error: "Failed to fetch queue" }, { status: 500 });
  }
}

const assignSchema = z.object({
  requestId: z.string(),
  assignToId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isVerifier(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data = assignSchema.parse(body);

    const verificationRequest = await prisma.verificationRequest.findUnique({
      where: { id: data.requestId },
    });

    if (!verificationRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Assign to self if no assignToId provided
    const assignToId = data.assignToId || session.user.id;

    const updated = await prisma.verificationRequest.update({
      where: { id: data.requestId },
      data: { assignedToId: assignToId },
      include: {
        assignedTo: { select: { id: true, fullName: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "VERIFICATION_REQUEST",
        entityId: data.requestId,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "ASSIGN",
        diff: { assignedToId: assignToId },
      },
    });

    return NextResponse.json({
      message: "Request assigned successfully",
      request: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error assigning verification request:", error);
    return NextResponse.json({ error: "Failed to assign request" }, { status: 500 });
  }
}

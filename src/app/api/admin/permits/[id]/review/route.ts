import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function isPermitReviewer(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.some((role) => ["ADMIN", "MODERATOR", "COMPLIANCE"].includes(role)) || false;
}

const reviewSchema = z.object({
  action: z.enum(["start_review", "raise_query", "approve", "reject"]),
  note: z.string().optional(),
  queryTitle: z.string().optional(),
  queryDetails: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isPermitReviewer(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = reviewSchema.parse(body);

    const permit = await prisma.permitApplication.findUnique({
      where: { id },
      select: { id: true, status: true, applicantId: true },
    });

    if (!permit) {
      return NextResponse.json({ error: "Permit not found" }, { status: 404 });
    }

    let newStatus: string | undefined;
    let statusNote = data.note;

    switch (data.action) {
      case "start_review":
        if (!["SUBMITTED", "RESUBMITTED"].includes(permit.status)) {
          return NextResponse.json({ error: "Cannot start review for this status" }, { status: 400 });
        }
        newStatus = "UNDER_REVIEW";
        statusNote = "Review started";
        break;

      case "raise_query":
        if (!data.queryTitle) {
          return NextResponse.json({ error: "queryTitle is required" }, { status: 400 });
        }
        newStatus = "QUERY_RAISED";
        
        // Create query
        await prisma.permitQuery.create({
          data: {
            permitApplicationId: id,
            title: data.queryTitle,
            details: data.queryDetails,
            status: "OPEN",
          },
        });
        break;

      case "approve":
        if (permit.status !== "UNDER_REVIEW") {
          return NextResponse.json({ error: "Can only approve from UNDER_REVIEW" }, { status: 400 });
        }
        newStatus = "APPROVED";
        break;

      case "reject":
        if (!["UNDER_REVIEW", "QUERY_RAISED"].includes(permit.status)) {
          return NextResponse.json({ error: "Cannot reject from this status" }, { status: 400 });
        }
        newStatus = "REJECTED";
        break;
    }

    if (newStatus) {
      await prisma.permitApplication.update({
        where: { id },
        data: {
          status: newStatus as any,
          decidedAt: ["APPROVED", "REJECTED"].includes(newStatus) ? new Date() : undefined,
        },
      });

      await prisma.permitStatusHistory.create({
        data: {
          permitApplicationId: id,
          fromStatus: permit.status as any,
          toStatus: newStatus as any,
          note: statusNote,
          changedById: session.user.id,
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "PERMIT_APPLICATION",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: `PERMIT_${data.action.toUpperCase()}`,
        diff: {
          previousStatus: permit.status,
          newStatus,
          note: data.note,
        },
      },
    });

    return NextResponse.json({
      message: `Permit ${data.action.replace("_", " ")} completed`,
      newStatus,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error reviewing permit:", error);
    return NextResponse.json({ error: "Failed to review permit" }, { status: 500 });
  }
}

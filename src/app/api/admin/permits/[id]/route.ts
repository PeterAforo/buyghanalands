import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const updatePermitSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "QUERY_RAISED", "APPROVED", "REJECTED"]),
  note: z.string().optional(),
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

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });

    if (!user?.roles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updatePermitSchema.parse(body);

    const permit = await prisma.permitApplication.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!permit) {
      return NextResponse.json({ error: "Permit not found" }, { status: 404 });
    }

    // Validate status transitions
    const allowedTransitions: { [key: string]: string[] } = {
      SUBMITTED: ["UNDER_REVIEW", "REJECTED"],
      UNDER_REVIEW: ["QUERY_RAISED", "APPROVED", "REJECTED"],
      QUERY_RAISED: ["UNDER_REVIEW"],
      RESUBMITTED: ["UNDER_REVIEW", "APPROVED", "REJECTED"],
    };

    if (!allowedTransitions[permit.status]?.includes(data.status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${permit.status} to ${data.status}` },
        { status: 400 }
      );
    }

    const updateData: any = {
      status: data.status,
    };

    if (data.status === "APPROVED" || data.status === "REJECTED") {
      updateData.decidedAt = new Date();
    }

    const updated = await prisma.permitApplication.update({
      where: { id },
      data: updateData,
    });

    // Create status history
    await prisma.permitStatusHistory.create({
      data: {
        permitApplicationId: id,
        status: data.status,
        changedById: session.user.id,
        note: data.note || `Status changed to ${data.status}`,
      },
    });

    return NextResponse.json({
      ...updated,
      estimatedCostGhs: updated.estimatedCostGhs?.toString() || null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error updating permit:", error);
    return NextResponse.json({ error: "Failed to update permit" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const updatePermitSchema = z.object({
  projectTitle: z.string().min(5).optional(),
  projectDescription: z.string().optional(),
  landLocationNote: z.string().optional(),
  plotSizeNote: z.string().optional(),
  estimatedCostGhs: z.number().optional(),
  buildingType: z.string().optional(),
  storeys: z.number().optional(),
  status: z.enum(["SUBMITTED", "CANCELLED"]).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const permit = await prisma.permitApplication.findUnique({
      where: { id },
      include: {
        assembly: true,
        listing: {
          select: { id: true, title: true, region: true, district: true },
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
        queries: {
          orderBy: { createdAt: "desc" },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!permit) {
      return NextResponse.json({ error: "Permit not found" }, { status: 404 });
    }

    // Check authorization
    if (permit.applicantId !== session.user.id) {
      // Check if admin
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { roles: true },
      });
      if (!user?.roles.includes("ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({
      ...permit,
      estimatedCostGhs: permit.estimatedCostGhs?.toString() || null,
    });
  } catch (error) {
    console.error("Error fetching permit:", error);
    return NextResponse.json({ error: "Failed to fetch permit" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updatePermitSchema.parse(body);

    const permit = await prisma.permitApplication.findUnique({
      where: { id },
      select: { applicantId: true, status: true },
    });

    if (!permit) {
      return NextResponse.json({ error: "Permit not found" }, { status: 404 });
    }

    if (permit.applicantId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can only edit draft permits
    if (permit.status !== "DRAFT" && permit.status !== "QUERY_RAISED") {
      if (data.status !== "CANCELLED") {
        return NextResponse.json({ error: "Cannot edit submitted permit" }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (data.projectTitle) updateData.projectTitle = data.projectTitle;
    if (data.projectDescription !== undefined) updateData.projectDescription = data.projectDescription;
    if (data.landLocationNote !== undefined) updateData.landLocationNote = data.landLocationNote;
    if (data.plotSizeNote !== undefined) updateData.plotSizeNote = data.plotSizeNote;
    if (data.estimatedCostGhs !== undefined) updateData.estimatedCostGhs = data.estimatedCostGhs;
    if (data.buildingType !== undefined) updateData.buildingType = data.buildingType;
    if (data.storeys !== undefined) updateData.storeys = data.storeys;

    if (data.status === "SUBMITTED") {
      updateData.status = "SUBMITTED";
      updateData.submittedAt = new Date();

      // Create status history
      await prisma.permitStatusHistory.create({
        data: {
          permitApplicationId: id,
          fromStatus: "DRAFT",
          toStatus: "SUBMITTED",
          note: "Application submitted for review",
        },
      });
    } else if (data.status === "CANCELLED") {
      updateData.status = "CANCELLED";

      await prisma.permitStatusHistory.create({
        data: {
          permitApplicationId: id,
          toStatus: "CANCELLED",
          note: "Application cancelled by applicant",
        },
      });
    }

    const updated = await prisma.permitApplication.update({
      where: { id },
      data: updateData,
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

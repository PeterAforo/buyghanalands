import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateWorkflowSchema = z.object({
  propertyTitle: z.string().optional(),
  propertyAddress: z.string().optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  town: z.string().optional(),
  plotNumber: z.string().optional(),
  landSizeAcres: z.number().optional(),
  currentModule: z.enum([
    "LAND_ACQUISITION",
    "PRE_CONSTRUCTION",
    "BUILDING_PERMIT",
    "CONSTRUCTION",
    "COMPLETION",
  ]).optional(),
  overallStatus: z.enum([
    "NOT_STARTED",
    "IN_PROGRESS",
    "ON_HOLD",
    "COMPLETED",
    "CANCELLED",
  ]).optional(),
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

    const workflow = await prisma.propertyWorkflow.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            region: true,
            district: true,
            town: true,
            priceGhs: true,
            sizeAcres: true,
            media: {
              take: 1,
              select: { url: true },
            },
          },
        },
        landAcquisition: true,
        preConstruction: true,
        buildingPermit: {
          include: {
            districtAssembly: {
              select: {
                id: true,
                name: true,
                region: true,
                district: true,
                contactEmail: true,
                contactPhone: true,
              },
            },
          },
        },
        construction: {
          include: {
            inspections: true,
          },
        },
        workflowDocuments: {
          orderBy: { createdAt: "desc" },
        },
        workflowNotes: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        workflowAlerts: {
          where: { isDismissed: false },
          orderBy: { createdAt: "desc" },
        },
        costTracker: true,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error("Error fetching workflow:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const validatedData = updateWorkflowSchema.parse(body);

    // Verify ownership
    const existingWorkflow = await prisma.propertyWorkflow.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingWorkflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    // Update workflow
    const workflow = await prisma.propertyWorkflow.update({
      where: { id },
      data: {
        ...validatedData,
        ...(validatedData.overallStatus === "IN_PROGRESS" &&
          existingWorkflow.overallStatus === "NOT_STARTED" && {
            startedAt: new Date(),
          }),
        ...(validatedData.overallStatus === "COMPLETED" && {
          completedAt: new Date(),
        }),
      },
      include: {
        landAcquisition: true,
        preConstruction: true,
        buildingPermit: true,
        construction: true,
      },
    });

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error("Error updating workflow:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update workflow" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const workflow = await prisma.propertyWorkflow.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    // Delete workflow (cascades to all related records)
    await prisma.propertyWorkflow.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting workflow:", error);
    return NextResponse.json(
      { error: "Failed to delete workflow" },
      { status: 500 }
    );
  }
}

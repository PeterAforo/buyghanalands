import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createAlertSchema = z.object({
  alertType: z.enum(["warning", "reminder", "deadline", "info", "success"]),
  title: z.string(),
  message: z.string(),
  module: z.enum([
    "LAND_ACQUISITION",
    "PRE_CONSTRUCTION",
    "BUILDING_PERMIT",
    "CONSTRUCTION",
    "COMPLETION",
  ]).optional(),
  stage: z.number().optional(),
  taskId: z.string().optional(),
  triggerDate: z.string().optional(),
  dueDate: z.string().optional(),
});

const updateAlertSchema = z.object({
  isRead: z.boolean().optional(),
  isDismissed: z.boolean().optional(),
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
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

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

    const alerts = await prisma.workflowAlert.findMany({
      where: {
        propertyWorkflowId: id,
        isDismissed: false,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const validatedData = createAlertSchema.parse(body);

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

    const alert = await prisma.workflowAlert.create({
      data: {
        propertyWorkflowId: id,
        alertType: validatedData.alertType,
        title: validatedData.title,
        message: validatedData.message,
        module: validatedData.module,
        stage: validatedData.stage,
        taskId: validatedData.taskId,
        triggerDate: validatedData.triggerDate
          ? new Date(validatedData.triggerDate)
          : null,
        dueDate: validatedData.dueDate
          ? new Date(validatedData.dueDate)
          : null,
        isRead: false,
        isDismissed: false,
      },
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    console.error("Error creating alert:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create alert" },
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
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get("alertId");
    const markAllRead = searchParams.get("markAllRead") === "true";

    const body = await request.json();
    const validatedData = updateAlertSchema.parse(body);

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

    if (markAllRead) {
      await prisma.workflowAlert.updateMany({
        where: {
          propertyWorkflowId: id,
          isRead: false,
        },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    if (!alertId) {
      return NextResponse.json(
        { error: "Alert ID required" },
        { status: 400 }
      );
    }

    const alert = await prisma.workflowAlert.update({
      where: {
        id: alertId,
        propertyWorkflowId: id,
      },
      data: validatedData,
    });

    return NextResponse.json({ alert });
  } catch (error) {
    console.error("Error updating alert:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update alert" },
      { status: 500 }
    );
  }
}

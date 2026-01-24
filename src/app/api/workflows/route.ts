import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createWorkflowSchema = z.object({
  listingId: z.string().optional(),
  propertyTitle: z.string().optional(),
  propertyAddress: z.string().optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  town: z.string().optional(),
  plotNumber: z.string().optional(),
  landSizeAcres: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const module = searchParams.get("module");

    const workflows = await prisma.propertyWorkflow.findMany({
      where: {
        userId: session.user.id,
        ...(status && { overallStatus: status as any }),
        ...(module && { currentModule: module as any }),
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            region: true,
            district: true,
            priceGhs: true,
          },
        },
        landAcquisition: {
          select: {
            currentStage: true,
            status: true,
            progress: true,
          },
        },
        preConstruction: {
          select: {
            currentStage: true,
            status: true,
            progress: true,
          },
        },
        buildingPermit: {
          select: {
            currentStage: true,
            status: true,
            progress: true,
          },
        },
        construction: {
          select: {
            currentStage: true,
            status: true,
            progress: true,
          },
        },
        _count: {
          select: {
            workflowDocuments: true,
            workflowAlerts: {
              where: { isRead: false, isDismissed: false },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ workflows });
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createWorkflowSchema.parse(body);

    // If linking to a listing, verify ownership
    if (validatedData.listingId) {
      const listing = await prisma.listing.findFirst({
        where: {
          id: validatedData.listingId,
          // User must be buyer in a transaction or the listing must be accessible
        },
      });

      if (!listing) {
        return NextResponse.json(
          { error: "Listing not found" },
          { status: 404 }
        );
      }

      // Auto-fill from listing
      validatedData.propertyTitle = validatedData.propertyTitle || listing.title;
      validatedData.region = validatedData.region || listing.region;
      validatedData.district = validatedData.district || listing.district;
      validatedData.town = validatedData.town || listing.town || undefined;
    }

    // Create the workflow with all sub-modules
    const workflow = await prisma.propertyWorkflow.create({
      data: {
        userId: session.user.id,
        listingId: validatedData.listingId,
        propertyTitle: validatedData.propertyTitle,
        propertyAddress: validatedData.propertyAddress,
        region: validatedData.region,
        district: validatedData.district,
        town: validatedData.town,
        plotNumber: validatedData.plotNumber,
        landSizeAcres: validatedData.landSizeAcres,
        currentModule: "LAND_ACQUISITION",
        overallStatus: "NOT_STARTED",
        overallProgress: 0,
        landAcquisition: {
          create: {
            currentStage: 1,
            status: "NOT_STARTED",
            progress: 0,
          },
        },
        costTracker: {
          create: {
            landPurchasePrice: null,
          },
        },
      },
      include: {
        landAcquisition: true,
        costTracker: true,
      },
    });

    // Create initial alerts
    await prisma.workflowAlert.createMany({
      data: [
        {
          propertyWorkflowId: workflow.id,
          alertType: "info",
          title: "Welcome to Your Property Workflow",
          message:
            "Start by engaging a real estate lawyer to guide you through the land acquisition process.",
          module: "LAND_ACQUISITION",
          stage: 1,
          isRead: false,
          isDismissed: false,
        },
        {
          propertyWorkflowId: workflow.id,
          alertType: "warning",
          title: "Important: Engage a Lawyer First",
          message:
            "It is strongly recommended to engage a qualified real estate lawyer before proceeding with any land purchase in Ghana.",
          module: "LAND_ACQUISITION",
          stage: 1,
          isRead: false,
          isDismissed: false,
        },
      ],
    });

    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error) {
    console.error("Error creating workflow:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create workflow" },
      { status: 500 }
    );
  }
}

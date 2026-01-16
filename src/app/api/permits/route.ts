import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createPermitSchema = z.object({
  assemblyId: z.string(),
  listingId: z.string().optional(),
  transactionId: z.string().optional(),
  projectTitle: z.string().min(5),
  projectDescription: z.string().optional(),
  landLocationNote: z.string().optional(),
  plotSizeNote: z.string().optional(),
  estimatedCostGhs: z.number().optional(),
  buildingType: z.string().optional(),
  storeys: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {
      applicantId: session.user.id,
    };

    if (status) where.status = status;

    const permits = await prisma.permitApplication.findMany({
      where,
      include: {
        assembly: {
          select: {
            id: true,
            name: true,
            region: true,
            district: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: { documents: true, queries: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serialized = permits.map((p) => ({
      ...p,
      estimatedCostGhs: p.estimatedCostGhs?.toString() || null,
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Error fetching permits:", error);
    return NextResponse.json({ error: "Failed to fetch permits" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createPermitSchema.parse(body);

    // Verify assembly exists
    const assembly = await prisma.districtAssembly.findUnique({
      where: { id: data.assemblyId },
    });

    if (!assembly) {
      return NextResponse.json({ error: "District assembly not found" }, { status: 400 });
    }

    const permit = await prisma.permitApplication.create({
      data: {
        applicantId: session.user.id,
        assemblyId: data.assemblyId,
        listingId: data.listingId,
        transactionId: data.transactionId,
        projectTitle: data.projectTitle,
        projectDescription: data.projectDescription,
        landLocationNote: data.landLocationNote,
        plotSizeNote: data.plotSizeNote,
        estimatedCostGhs: data.estimatedCostGhs,
        buildingType: data.buildingType,
        storeys: data.storeys,
        status: "DRAFT",
      },
      include: {
        assembly: true,
      },
    });

    // Create initial status history
    await prisma.permitStatusHistory.create({
      data: {
        permitApplicationId: permit.id,
        status: "DRAFT",
        note: "Application created",
      },
    });

    return NextResponse.json({
      ...permit,
      estimatedCostGhs: permit.estimatedCostGhs?.toString() || null,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error creating permit:", error);
    return NextResponse.json({ error: "Failed to create permit application" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const updateServiceRequestSchema = z.object({
  status: z.enum(["OPEN", "OFFERED", "ACCEPTED", "DECLINED", "CANCELLED", "IN_PROGRESS", "DELIVERED", "COMPLETED", "DISPUTED"]).optional(),
  acceptedPriceGhs: z.number().optional(),
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

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        professional: {
          include: {
            user: { select: { fullName: true, phone: true } },
          },
        },
        requester: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
        listing: {
          select: { id: true, title: true, region: true, district: true, town: true },
        },
        service: true,
        booking: {
          include: {
            reviews: true,
          },
        },
      },
    });

    if (!serviceRequest) {
      return NextResponse.json({ error: "Service request not found" }, { status: 404 });
    }

    // Check authorization
    const professional = await prisma.professionalProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    const isRequester = serviceRequest.requesterId === session.user.id;
    const isProfessional = professional?.id === serviceRequest.professionalId;

    if (!isRequester && !isProfessional) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      ...serviceRequest,
      offerPriceGhs: serviceRequest.offerPriceGhs?.toString() || null,
      acceptedPriceGhs: serviceRequest.acceptedPriceGhs?.toString() || null,
    });
  } catch (error) {
    console.error("Error fetching service request:", error);
    return NextResponse.json({ error: "Failed to fetch service request" }, { status: 500 });
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
    const data = updateServiceRequestSchema.parse(body);

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      select: { requesterId: true, professionalId: true, status: true },
    });

    if (!serviceRequest) {
      return NextResponse.json({ error: "Service request not found" }, { status: 404 });
    }

    // Check authorization
    const professional = await prisma.professionalProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    const isRequester = serviceRequest.requesterId === session.user.id;
    const isProfessional = professional?.id === serviceRequest.professionalId;

    if (!isRequester && !isProfessional) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate status transitions
    if (data.status) {
      const allowedTransitions: { [key: string]: string[] } = {
        OPEN: ["OFFERED", "ACCEPTED", "CANCELLED"],
        OFFERED: ["ACCEPTED", "DECLINED", "CANCELLED"],
        ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
        IN_PROGRESS: ["DELIVERED", "CANCELLED", "DISPUTED"],
        DELIVERED: ["COMPLETED", "DISPUTED"],
        COMPLETED: [],
        CANCELLED: [],
        DECLINED: [],
        DISPUTED: ["COMPLETED", "CANCELLED"],
      };

      if (!allowedTransitions[serviceRequest.status]?.includes(data.status)) {
        return NextResponse.json(
          { error: `Cannot transition from ${serviceRequest.status} to ${data.status}` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.serviceRequest.update({
      where: { id },
      data: {
        status: data.status,
        acceptedPriceGhs: data.acceptedPriceGhs,
        closedAt: data.status === "COMPLETED" || data.status === "CANCELLED" ? new Date() : undefined,
      },
    });

    return NextResponse.json({
      ...updated,
      offerPriceGhs: updated.offerPriceGhs?.toString() || null,
      acceptedPriceGhs: updated.acceptedPriceGhs?.toString() || null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error updating service request:", error);
    return NextResponse.json({ error: "Failed to update service request" }, { status: 500 });
  }
}

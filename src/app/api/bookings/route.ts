import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createServiceRequestSchema = z.object({
  professionalId: z.string().optional(),
  serviceId: z.string().optional(),
  listingId: z.string().optional(),
  title: z.string().min(5),
  details: z.string().optional(),
  preferredDate: z.string().optional(),
  locationNote: z.string().optional(),
  offerPriceGhs: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "client";
    const status = searchParams.get("status");

    let where: any = {};

    if (role === "professional") {
      const professional = await prisma.professionalProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (!professional) {
        return NextResponse.json({ error: "Not a professional" }, { status: 403 });
      }
      where.professionalId = professional.id;
    } else {
      where.requesterId = session.user.id;
    }

    if (status) where.status = status;

    const requests = await prisma.serviceRequest.findMany({
      where,
      include: {
        professional: {
          select: {
            id: true,
            companyName: true,
            professionalType: true,
            user: {
              select: { fullName: true },
            },
          },
        },
        requester: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            region: true,
            district: true,
          },
        },
        service: {
          select: {
            id: true,
            title: true,
            priceGhs: true,
          },
        },
        booking: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const serialized = requests.map((r) => ({
      ...r,
      offerPriceGhs: r.offerPriceGhs?.toString() || null,
      acceptedPriceGhs: r.acceptedPriceGhs?.toString() || null,
      service: r.service ? {
        ...r.service,
        priceGhs: r.service.priceGhs?.toString() || null,
      } : null,
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Error fetching service requests:", error);
    return NextResponse.json({ error: "Failed to fetch service requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createServiceRequestSchema.parse(body);

    // Validate professional if specified
    if (data.professionalId) {
      const professional = await prisma.professionalProfile.findUnique({
        where: { id: data.professionalId },
        select: { isActive: true },
      });
      if (!professional || !professional.isActive) {
        return NextResponse.json({ error: "Professional not available" }, { status: 400 });
      }
    }

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        requesterId: session.user.id,
        professionalId: data.professionalId,
        serviceId: data.serviceId,
        listingId: data.listingId,
        title: data.title,
        details: data.details,
        preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,
        locationNote: data.locationNote,
        offerPriceGhs: data.offerPriceGhs,
        status: "OPEN",
      },
      include: {
        professional: {
          select: {
            companyName: true,
            user: { select: { fullName: true } },
          },
        },
      },
    });

    return NextResponse.json({
      ...serviceRequest,
      offerPriceGhs: serviceRequest.offerPriceGhs?.toString() || null,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error creating service request:", error);
    return NextResponse.json({ error: "Failed to create service request" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const services = await withDbRetry(() => prisma.professionalService.findMany({
      where: {
        professionalId: id,
        isPublished: true,
      },
      orderBy: { createdAt: "desc" },
    }));

    return NextResponse.json(serializeForJson(services));
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

const createServiceSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  priceGhs: z.number().optional(),
  priceModel: z.enum(["FIXED", "HOURLY", "NEGOTIABLE"]).default("FIXED"),
  turnaroundDays: z.number().optional(),
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

    const { id } = await params;
    const body = await request.json();
    const data = createServiceSchema.parse(body);

    // Verify ownership
    const professional = await withDbRetry(() => prisma.professionalProfile.findUnique({
      where: { id },
      select: { userId: true },
    }));

    if (!professional) {
      return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    }

    if (professional.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const service = await withDbRetry(() => prisma.professionalService.create({
      data: {
        professionalId: id,
        title: data.title,
        description: data.description,
        priceGhs: data.priceGhs ? BigInt(data.priceGhs) : null,
        priceModel: data.priceModel,
        turnaroundDays: data.turnaroundDays,
        isPublished: true,
      },
    }));

    return NextResponse.json(serializeForJson(service), { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating service:", error);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}

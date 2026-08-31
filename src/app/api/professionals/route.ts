import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";

const createProfessionalSchema = z.object({
  professionalType: z.enum(["SURVEYOR", "LAWYER", "VALUER", "ARCHITECT", "ENGINEER", "PLANNER"]),
  companyName: z.string().optional(),
  bio: z.string().min(20),
  licenseNumber: z.string().optional(),
  licenseBody: z.string().optional(),
  yearsExperience: z.number().min(0).optional(),
  serviceRegions: z.array(z.string()).min(1),
  baseLocation: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const region = searchParams.get("region");
    const search = searchParams.get("search");

    const where: any = {
      isActive: true,
    };

    if (category) where.professionalType = category;
    if (region) where.serviceRegions = { has: region };
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } },
        { user: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const professionals = await withDbRetry(() => prisma.professionalProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        services: {
          where: { isPublished: true },
          take: 3,
        },
        reviewsReceived: {
          select: { rating: true },
        },
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }));

    const serialized = professionals.map((p) => ({
      id: p.id,
      professionalType: p.professionalType,
      companyName: p.companyName,
      bio: p.bio,
      baseLocation: p.baseLocation,
      licenseStatus: p.licenseStatus,
      yearsExperience: p.yearsExperience,
      serviceRegions: p.serviceRegions,
      user: p.user,
      services: p.services.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        priceGhs: s.priceGhs != null ? s.priceGhs.toString() : null,
        turnaroundDays: s.turnaroundDays,
      })),
      avgRating:
        p.reviewsReceived.length > 0
          ? p.reviewsReceived.reduce((acc, r) => acc + r.rating, 0) / p.reviewsReceived.length
          : 0,
      reviewCount: p.reviewsReceived.length,
    }));

    return NextResponse.json({ professionals: serialized });
  } catch (error) {
    console.error("Error fetching professionals:", error);
    return NextResponse.json({ error: "Failed to fetch professionals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createProfessionalSchema.parse(body);

    // Check if user already has a professional profile
    const existing = await withDbRetry(() => prisma.professionalProfile.findUnique({
      where: { userId: session.user.id },
    }));

    if (existing) {
      return NextResponse.json({ error: "Professional profile already exists" }, { status: 400 });
    }

    const professional = await withDbRetry(() => prisma.professionalProfile.create({
      data: {
        userId: session.user.id,
        professionalType: data.professionalType,
        companyName: data.companyName,
        bio: data.bio,
        licenseNumber: data.licenseNumber,
        licenseBody: data.licenseBody,
        yearsExperience: data.yearsExperience,
        serviceRegions: data.serviceRegions,
        baseLocation: data.baseLocation,
        isActive: true,
      },
    }));

    // Add PROFESSIONAL role to user
    await withDbRetry(() => prisma.user.update({
      where: { id: session.user.id },
      data: {
        roles: { push: "PROFESSIONAL" },
      },
    }));

    return NextResponse.json(professional, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error creating professional:", error);
    return NextResponse.json({ error: "Failed to create professional profile" }, { status: 500 });
  }
}

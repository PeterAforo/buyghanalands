import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const professional = await prisma.professionalProfile.findUnique({
      where: { id },
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
        },
        reviewsReceived: {
          include: {
            reviewer: {
              select: { fullName: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!professional) {
      return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    }

    const avgRating = professional.reviewsReceived.length > 0
      ? professional.reviewsReceived.reduce((acc, r) => acc + r.rating, 0) / professional.reviewsReceived.length
      : 0;

    return NextResponse.json({
      ...professional,
      avgRating,
      reviewCount: professional.reviewsReceived.length,
    });
  } catch (error) {
    console.error("Error fetching professional:", error);
    return NextResponse.json({ error: "Failed to fetch professional" }, { status: 500 });
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

    // Verify ownership
    const professional = await prisma.professionalProfile.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!professional) {
      return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    }

    if (professional.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.professionalProfile.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating professional:", error);
    return NextResponse.json({ error: "Failed to update professional" }, { status: 500 });
  }
}

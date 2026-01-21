import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        services: {
          orderBy: { createdAt: "desc" },
        },
        bookings: {
          include: {
            serviceRequest: {
              include: {
                requester: {
                  select: { fullName: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        reviewsReceived: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Professional profile not found" }, { status: 404 });
    }

    // Serialize BigInt values
    const serialized = {
      ...profile,
      services: profile.services.map((s) => ({
        ...s,
        priceGhs: s.priceGhs?.toString() || null,
      })),
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Error fetching professional profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

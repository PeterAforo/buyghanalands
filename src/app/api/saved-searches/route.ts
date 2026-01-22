import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const savedSearchSchema = z.object({
  name: z.string().min(1).max(100),
  filters: z.object({
    region: z.string().optional(),
    district: z.string().optional(),
    landType: z.string().optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    minSize: z.number().optional(),
    maxSize: z.number().optional(),
    tenureType: z.string().optional(),
    verifiedOnly: z.boolean().optional(),
  }),
  alertEnabled: z.boolean().default(false),
});

// GET - Get user's saved searches
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const savedSearches = await prisma.savedSearch.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    const serialized = savedSearches.map((s) => ({
      id: s.id,
      name: s.name,
      filters: s.filters,
      alertEnabled: s.alertEnabled,
      lastRunAt: s.lastRunAt?.toISOString() || null,
      createdAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Error fetching saved searches:", error);
    return NextResponse.json({ error: "Failed to fetch saved searches" }, { status: 500 });
  }
}

// POST - Create saved search
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = savedSearchSchema.parse(body);

    // Limit saved searches per user
    const count = await prisma.savedSearch.count({
      where: { userId: session.user.id },
    });

    if (count >= 10) {
      return NextResponse.json(
        { error: "Maximum 10 saved searches allowed" },
        { status: 400 }
      );
    }

    const savedSearch = await prisma.savedSearch.create({
      data: {
        userId: session.user.id,
        name: data.name,
        filters: data.filters,
        alertEnabled: data.alertEnabled,
      },
    });

    return NextResponse.json({
      id: savedSearch.id,
      name: savedSearch.name,
      filters: savedSearch.filters,
      alertEnabled: savedSearch.alertEnabled,
      createdAt: savedSearch.createdAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating saved search:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create saved search" }, { status: 500 });
  }
}

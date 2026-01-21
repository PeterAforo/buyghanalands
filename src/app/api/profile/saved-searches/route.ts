import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const savedSearches = await prisma.savedSearch.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(savedSearches);
  } catch (error) {
    console.error("Error fetching saved searches:", error);
    return NextResponse.json({ error: "Failed to fetch saved searches" }, { status: 500 });
  }
}

const createSavedSearchSchema = z.object({
  name: z.string().min(1).max(100),
  filters: z.object({
    region: z.string().optional(),
    district: z.string().optional(),
    landType: z.string().optional(),
    tenureType: z.string().optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    minSize: z.number().optional(),
    maxSize: z.number().optional(),
    verified: z.boolean().optional(),
    search: z.string().optional(),
  }),
  alertEnabled: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createSavedSearchSchema.parse(body);

    // Limit saved searches per user
    const count = await prisma.savedSearch.count({
      where: { userId: session.user.id },
    });

    if (count >= 20) {
      return NextResponse.json(
        { error: "Maximum 20 saved searches allowed. Please delete some to add new ones." },
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

    return NextResponse.json(savedSearch, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating saved search:", error);
    return NextResponse.json({ error: "Failed to create saved search" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const savedSearch = await prisma.savedSearch.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!savedSearch) {
      return NextResponse.json({ error: "Saved search not found" }, { status: 404 });
    }

    if (savedSearch.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.savedSearch.delete({ where: { id } });

    return NextResponse.json({ message: "Saved search deleted" });
  } catch (error) {
    console.error("Error deleting saved search:", error);
    return NextResponse.json({ error: "Failed to delete saved search" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSearchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  alertEnabled: z.boolean().optional(),
});

// GET - Get a specific saved search
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

    const savedSearch = await prisma.savedSearch.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!savedSearch) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: savedSearch.id,
      name: savedSearch.name,
      filters: savedSearch.filters,
      alertEnabled: savedSearch.alertEnabled,
      lastRunAt: savedSearch.lastRunAt?.toISOString() || null,
      createdAt: savedSearch.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching saved search:", error);
    return NextResponse.json({ error: "Failed to fetch saved search" }, { status: 500 });
  }
}

// PUT - Update saved search
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
    const data = updateSearchSchema.parse(body);

    const existing = await prisma.savedSearch.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.savedSearch.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        alertEnabled: data.alertEnabled ?? existing.alertEnabled,
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      alertEnabled: updated.alertEnabled,
    });
  } catch (error) {
    console.error("Error updating saved search:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update saved search" }, { status: 500 });
  }
}

// DELETE - Delete saved search
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.savedSearch.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.savedSearch.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting saved search:", error);
    return NextResponse.json({ error: "Failed to delete saved search" }, { status: 500 });
  }
}

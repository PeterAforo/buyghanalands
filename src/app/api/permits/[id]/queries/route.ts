import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    const permit = await prisma.permitApplication.findUnique({
      where: { id },
      select: { applicantId: true },
    });

    if (!permit) {
      return NextResponse.json({ error: "Permit not found" }, { status: 404 });
    }

    // Check authorization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });
    const isAdmin = user?.roles.some((r) => ["ADMIN", "SUPPORT"].includes(r));

    if (permit.applicantId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const queries = await prisma.permitQuery.findMany({
      where: { permitApplicationId: id },
      orderBy: { raisedAt: "desc" },
    });

    return NextResponse.json(queries);
  } catch (error) {
    console.error("Error fetching permit queries:", error);
    return NextResponse.json({ error: "Failed to fetch queries" }, { status: 500 });
  }
}

const respondToQuerySchema = z.object({
  queryId: z.string(),
  response: z.string().min(10),
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
    const data = respondToQuerySchema.parse(body);

    const permit = await prisma.permitApplication.findUnique({
      where: { id },
      select: { applicantId: true, status: true },
    });

    if (!permit) {
      return NextResponse.json({ error: "Permit not found" }, { status: 404 });
    }

    if (permit.applicantId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const query = await prisma.permitQuery.findUnique({
      where: { id: data.queryId },
      select: { permitApplicationId: true, status: true },
    });

    if (!query || query.permitApplicationId !== id) {
      return NextResponse.json({ error: "Query not found" }, { status: 404 });
    }

    if (query.status !== "OPEN") {
      return NextResponse.json({ error: "Query already responded" }, { status: 400 });
    }

    // Update query with response
    const updated = await prisma.permitQuery.update({
      where: { id: data.queryId },
      data: {
        response: data.response,
        status: "RESPONDED",
        respondedAt: new Date(),
      },
    });

    // Check if all queries are responded
    const openQueries = await prisma.permitQuery.count({
      where: {
        permitApplicationId: id,
        status: "OPEN",
      },
    });

    // If all queries responded and permit was in QUERY_RAISED, update to RESUBMITTED
    if (openQueries === 0 && permit.status === "QUERY_RAISED") {
      await prisma.permitApplication.update({
        where: { id },
        data: { status: "RESUBMITTED" },
      });

      await prisma.permitStatusHistory.create({
        data: {
          permitApplicationId: id,
          fromStatus: "QUERY_RAISED",
          toStatus: "RESUBMITTED",
          note: "All queries responded",
          changedById: session.user.id,
        },
      });
    }

    return NextResponse.json({
      message: "Query response submitted",
      query: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error responding to query:", error);
    return NextResponse.json({ error: "Failed to respond to query" }, { status: 500 });
  }
}

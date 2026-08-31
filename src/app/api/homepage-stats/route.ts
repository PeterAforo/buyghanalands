import { NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

export async function GET() {
  try {
    const stats = await withDbRetry(() => prisma.homepageStat.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    }));

    return NextResponse.json({ stats: serializeForJson(stats) });
  } catch (error) {
    console.error("Error fetching homepage stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch homepage stats" },
      { status: 500 }
    );
  }
}

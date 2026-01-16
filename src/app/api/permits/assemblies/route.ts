import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region");

    const where: any = {};
    if (region) where.region = region;

    const assemblies = await prisma.districtAssembly.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(assemblies);
  } catch (error) {
    console.error("Error fetching assemblies:", error);
    return NextResponse.json({ error: "Failed to fetch assemblies" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

export async function GET() {
  try {
    const [categories, faqs] = await Promise.all([
      withDbRetry(() => prisma.supportCategory.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      })),
      withDbRetry(() => prisma.faqItem.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      })),
    ]);

    return NextResponse.json({
      categories: serializeForJson(categories),
      faqs: serializeForJson(faqs),
    });
  } catch (error) {
    console.error("Error fetching support content:", error);
    return NextResponse.json(
      { error: "Failed to fetch support content" },
      { status: 500 }
    );
  }
}

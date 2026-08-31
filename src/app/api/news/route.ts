import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const featuredOnly = searchParams.get("featured") === "true";
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const articles = await withDbRetry(() => prisma.newsArticle.findMany({
      where: {
        isPublished: true,
        ...(category && { category }),
        ...(featuredOnly && { isFeatured: true }),
      },
      orderBy: { publishedAt: "desc" },
      take: Math.min(limit, 50),
    }));

    return NextResponse.json({ articles: serializeForJson(articles) });
  } catch (error) {
    console.error("Error fetching news articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch news articles" },
      { status: 500 }
    );
  }
}

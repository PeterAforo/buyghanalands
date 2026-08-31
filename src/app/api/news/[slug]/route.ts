import { NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const article = await withDbRetry(() => prisma.newsArticle.findUnique({
      where: { slug },
    }));

    if (!article || !article.isPublished) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ article: serializeForJson(article) });
  } catch (error) {
    console.error("Error fetching news article:", error);
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}

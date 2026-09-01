import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pageKey: string }> }
) {
  try {
    const { pageKey } = await params;
    const prefix = `page.${pageKey}.`;

    const settings = await withDbRetry(() =>
      prisma.siteSetting.findMany({
        where: { key: { startsWith: prefix } },
      })
    );

    const content: Record<string, any> = {};
    for (const setting of settings) {
      const sectionKey = setting.key.slice(prefix.length);
      try {
        content[sectionKey] = JSON.parse(setting.value);
      } catch {
        content[sectionKey] = setting.value;
      }
    }

    return NextResponse.json(serializeForJson({ pageKey, content }));
  } catch (error) {
    console.error("Error fetching page content:", error);
    return NextResponse.json(
      { error: "Failed to fetch page content" },
      { status: 500 }
    );
  }
}

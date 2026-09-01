import { NextResponse } from "next/server";
import { getFooterContent } from "@/lib/cms";
import { serializeForJson } from "@/lib/serialize";

export async function GET() {
  try {
    const footerContent = await getFooterContent();
    return NextResponse.json(serializeForJson(footerContent));
  } catch (error) {
    console.error("Error fetching footer content:", error);
    return NextResponse.json({}, { status: 200 });
  }
}

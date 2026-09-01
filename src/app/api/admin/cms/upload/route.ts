import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";
import { uploadImage } from "@/lib/cloudinary";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await withDbRetry(() =>
    prisma.user.findUnique({ where: { id: userId }, select: { roles: true } })
  );
  return user?.roles.some((r) => ["ADMIN", "MODERATOR"].includes(r)) || false;
}

// POST — upload an image for CMS content (hero, news, regions, etc.)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { image, folder } = body as { image: string; folder?: string };

    if (!image || !image.startsWith("data:image/")) {
      return NextResponse.json({ error: "Valid base64 image required" }, { status: 400 });
    }

    // Limit to 5MB base64
    if (image.length > 5 * 1024 * 1024 * 1.37) {
      return NextResponse.json({ error: "Image too large (max 5MB)" }, { status: 400 });
    }

    const result = await uploadImage(image, {
      folder: folder || "buyghanalands/cms",
      transformation: {
        width: 1920,
        height: 1080,
        crop: "limit",
        quality: "auto",
      },
    });

    if (!result.success || !result.url) {
      return NextResponse.json({ error: result.error || "Upload failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    console.error("CMS image upload error:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}

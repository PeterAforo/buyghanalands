import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const listingId = formData.get("listingId") as string;
    const type = formData.get("type") as string; // "photo" or "document"

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (!listingId) {
      return NextResponse.json({ error: "Listing ID required" }, { status: 400 });
    }

    // Verify ownership
    const listing = await prisma.listing.findFirst({
      where: {
        id: listingId,
        sellerId: session.user.id,
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found or unauthorized" }, { status: 404 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Validate file type
      const isImage = file.type.startsWith("image/");
      const isDocument = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type) || file.type.startsWith("image/");

      if (type === "photo" && !isImage) {
        continue; // Skip non-image files for photo uploads
      }

      if (type === "document" && !isDocument) {
        continue; // Skip invalid document types
      }

      // Generate unique filename
      const ext = file.name.split('.').pop() || 'bin';
      const filename = `${listingId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      // Upload to Vercel Blob
      const blob = await put(filename, file, {
        access: "public",
      });

      // Create database record
      const mediaType = isImage ? "IMAGE" : "DOCUMENT";

      const media = await prisma.listingMedia.create({
        data: {
          listingId,
          type: mediaType,
          url: blob.url,
          sortOrder: uploadedFiles.length,
        },
      });

      uploadedFiles.push({
        id: media.id,
        url: media.url,
        type: media.type,
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const ALLOWED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const type = formData.get("type") as string; // "image" or "document"
    const listingId = formData.get("listingId") as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (files.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 files allowed per upload" },
        { status: 400 }
      );
    }

    // Validate file types and sizes
    const allowedTypes = type === "document" ? ALLOWED_DOCUMENT_TYPES : ALLOWED_IMAGE_TYPES;
    
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(", ")}` },
          { status: 400 }
        );
      }
      
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds maximum size of 10MB` },
          { status: 400 }
        );
      }
    }

    // If listingId provided, verify ownership
    if (listingId) {
      const listing = await prisma.listing.findFirst({
        where: {
          id: listingId,
          sellerId: session.user.id,
        },
      });

      if (!listing) {
        return NextResponse.json(
          { error: "Listing not found or unauthorized" },
          { status: 404 }
        );
      }
    }

    const uploadedFiles: {
      id?: string;
      url: string;
      publicId: string;
      filename: string;
      size: number;
      type: string;
    }[] = [];
    const errors: string[] = [];

    // Get current max sort order for listing media
    let sortOrder = 0;
    if (listingId && type === "image") {
      const maxSort = await prisma.listingMedia.aggregate({
        where: { listingId },
        _max: { sortOrder: true },
      });
      sortOrder = (maxSort._max.sortOrder || 0) + 1;
    }

    // Upload each file to Cloudinary
    for (const file of files) {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString("base64");
        const dataUri = `data:${file.type};base64,${base64}`;

        const folder = type === "document" 
          ? `buyghanalands/documents/${session.user.id}`
          : `buyghanalands/listings/${listingId || session.user.id}`;

        const uploadResult = await cloudinary.uploader.upload(dataUri, {
          folder,
          resource_type: type === "document" ? "auto" : "image",
          transformation: type === "image" ? [
            { width: 1920, height: 1080, crop: "limit" },
            { quality: "auto:good" },
            { fetch_format: "auto" },
          ] : undefined,
        });

        // Save to database if it's a listing image
        if (listingId && type === "image") {
          const media = await prisma.listingMedia.create({
            data: {
              listingId,
              type: "PHOTO",
              url: uploadResult.secure_url,
              sortOrder: sortOrder++,
            },
          });

          uploadedFiles.push({
            id: media.id,
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            filename: file.name,
            size: file.size,
            type: file.type,
          });
        } else {
          uploadedFiles.push({
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            filename: file.name,
            size: file.size,
            type: file.type,
          });
        }
      } catch (uploadError) {
        console.error(`Failed to upload ${file.name}:`, uploadError);
        errors.push(`Failed to upload ${file.name}`);
      }
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
      total: uploadedFiles.length,
    });
  } catch (error) {
    console.error("Multipart upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get signed upload URL for direct client uploads (optional)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "image";
    const listingId = searchParams.get("listingId");

    const folder = type === "document"
      ? `buyghanalands/documents/${session.user.id}`
      : `buyghanalands/listings/${listingId || session.user.id}`;

    const timestamp = Math.round(Date.now() / 1000);
    
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({
      signature,
      timestamp,
      folder,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    });
  } catch (error) {
    console.error("Get upload signature error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

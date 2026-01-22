import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { uploadImage } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { images, listingId } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    if (images.length > 10) {
      return NextResponse.json({ error: "Maximum 10 images allowed" }, { status: 400 });
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
        return NextResponse.json({ error: "Listing not found or unauthorized" }, { status: 404 });
      }
    }

    const uploadedImages: { id?: string; url: string; publicId: string }[] = [];
    const errors: string[] = [];

    // Get current max sort order for listing
    let sortOrder = 0;
    if (listingId) {
      const maxSort = await prisma.listingMedia.aggregate({
        where: { listingId },
        _max: { sortOrder: true },
      });
      sortOrder = (maxSort._max.sortOrder || 0) + 1;
    }

    for (let i = 0; i < images.length; i++) {
      const imageData = images[i];
      
      // Validate base64 image
      if (!imageData.startsWith('data:image/')) {
        errors.push(`Image ${i + 1}: Invalid format`);
        continue;
      }

      // Upload to Cloudinary
      const result = await uploadImage(imageData, {
        folder: listingId ? `buyghanalands/listings/${listingId}` : 'buyghanalands/temp',
        transformation: {
          width: 1920,
          height: 1080,
          crop: 'limit',
          quality: 'auto',
        },
      });

      if (!result.success || !result.url) {
        errors.push(`Image ${i + 1}: ${result.error || 'Upload failed'}`);
        continue;
      }

      // If listingId, create database record
      if (listingId) {
        const mediaRecord = await prisma.listingMedia.create({
          data: {
            listingId,
            type: "PHOTO",
            url: result.url,
            sortOrder: sortOrder + i,
          },
        });

        uploadedImages.push({
          id: mediaRecord.id,
          url: result.url,
          publicId: result.publicId!,
        });
      } else {
        uploadedImages.push({
          url: result.url,
          publicId: result.publicId!,
        });
      }
    }

    return NextResponse.json({
      success: true,
      images: uploadedImages,
      errors: errors.length > 0 ? errors : undefined,
      message: `${uploadedImages.length} image(s) uploaded successfully`,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 }
    );
  }
}

// DELETE - Remove image
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get("id");

    if (!mediaId) {
      return NextResponse.json({ error: "Media ID required" }, { status: 400 });
    }

    // Find and verify ownership
    const media = await prisma.listingMedia.findFirst({
      where: { id: mediaId },
      include: {
        listing: {
          select: { sellerId: true },
        },
      },
    });

    if (!media || media.listing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    // Delete from database
    await prisma.listingMedia.delete({ where: { id: mediaId } });

    // Note: Cloudinary deletion would require storing publicId
    // For now, we just remove from database

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Image delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}

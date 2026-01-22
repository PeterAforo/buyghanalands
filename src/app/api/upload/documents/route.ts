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
    const { documents, listingId } = body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json({ error: "No documents provided" }, { status: 400 });
    }

    if (documents.length > 5) {
      return NextResponse.json({ error: "Maximum 5 documents allowed" }, { status: 400 });
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

    const uploadedDocs: { id?: string; url: string; name: string; type: string; size: number }[] = [];
    const errors: string[] = [];

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      
      if (!doc.data || !doc.name) {
        errors.push(`Document ${i + 1}: Invalid format`);
        continue;
      }

      // Upload to Cloudinary (works for PDFs and images)
      const result = await uploadImage(doc.data, {
        folder: listingId ? `buyghanalands/documents/${listingId}` : 'buyghanalands/documents/temp',
        resourceType: doc.type === 'application/pdf' ? 'raw' : 'image',
      });

      if (!result.success || !result.url) {
        errors.push(`Document ${i + 1}: ${result.error || 'Upload failed'}`);
        continue;
      }

      // If listingId, create database record
      if (listingId) {
        // Determine document type based on name/content
        let docType = "OTHER";
        const nameLower = doc.name.toLowerCase();
        if (nameLower.includes("site") || nameLower.includes("plan")) {
          docType = "SITE_PLAN";
        } else if (nameLower.includes("indenture")) {
          docType = "INDENTURE";
        } else if (nameLower.includes("title") || nameLower.includes("certificate")) {
          docType = "LAND_TITLE_CERTIFICATE";
        } else if (nameLower.includes("search")) {
          docType = "SEARCH_REPORT";
        }

        const docRecord = await prisma.listingDocument.create({
          data: {
            listingId,
            type: docType as any,
            url: result.url,
            accessPolicy: "LOGGED_IN_REDACTED",
          },
        });

        uploadedDocs.push({
          id: docRecord.id,
          url: result.url,
          name: doc.name,
          type: doc.type,
          size: doc.size,
        });
      } else {
        uploadedDocs.push({
          url: result.url,
          name: doc.name,
          type: doc.type,
          size: doc.size,
        });
      }
    }

    return NextResponse.json({
      success: true,
      documents: uploadedDocs,
      errors: errors.length > 0 ? errors : undefined,
      message: `${uploadedDocs.length} document(s) uploaded successfully`,
    });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload documents" },
      { status: 500 }
    );
  }
}

// DELETE - Remove document
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const docId = searchParams.get("id");

    if (!docId) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 });
    }

    // Find and verify ownership
    const doc = await prisma.listingDocument.findFirst({
      where: { id: docId },
      include: {
        listing: {
          select: { sellerId: true },
        },
      },
    });

    if (!doc || doc.listing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    // Delete from database
    await prisma.listingDocument.delete({ where: { id: docId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Document delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}

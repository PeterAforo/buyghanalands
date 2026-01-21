import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");
    const transactionId = searchParams.get("transactionId");
    const type = searchParams.get("type");

    const where: any = {};

    if (listingId) {
      // Check if user has access to listing documents
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { sellerId: true },
      });

      if (!listing) {
        return NextResponse.json({ error: "Listing not found" }, { status: 404 });
      }

      // Check if user is seller or has an active transaction
      const hasAccess = listing.sellerId === session.user.id ||
        await prisma.transaction.findFirst({
          where: {
            listingId,
            buyerId: session.user.id,
            status: { notIn: ["CLOSED", "REFUNDED"] },
          },
        });

      if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      where.listingId = listingId;
    } else if (transactionId) {
      // Check if user is party to transaction
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        select: { buyerId: true, sellerId: true },
      });

      if (!transaction) {
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
      }

      if (transaction.buyerId !== session.user.id && transaction.sellerId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      where.transactionId = transactionId;
    } else {
      // Return user's own documents
      where.ownerId = session.user.id;
    }

    if (type) {
      where.type = type;
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Log access
    await prisma.documentAccessLog.createMany({
      data: documents.map((doc) => ({
        documentId: doc.id,
        userId: session.user.id,
        action: "VIEW_LIST",
      })),
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

const uploadDocumentSchema = z.object({
  url: z.string().url(),
  type: z.enum([
    "INDENTURE_DEED",
    "SITE_PLAN",
    "CADASTRAL_PLAN",
    "LAND_TITLE_CERTIFICATE",
    "LETTERS_OF_ADMINISTRATION",
    "FAMILY_RESOLUTION",
    "OTHER",
    "SELLER_ID",
    "VERIFICATION_CERTIFICATE",
    "TRANSACTION_AGREEMENT",
  ]),
  listingId: z.string().optional(),
  transactionId: z.string().optional(),
  disputeId: z.string().optional(),
  accessPolicy: z.enum(["PRIVATE", "LOGGED_IN_REDACTED", "TRANSACTION_PARTIES", "PUBLIC"]).default("PRIVATE"),
  mimeType: z.string().optional(),
  fileSizeBytes: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = uploadDocumentSchema.parse(body);

    // Verify ownership/access for linked entities
    if (data.listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: data.listingId },
        select: { sellerId: true },
      });
      if (!listing || listing.sellerId !== session.user.id) {
        return NextResponse.json({ error: "Cannot add document to this listing" }, { status: 403 });
      }
    }

    if (data.transactionId) {
      const transaction = await prisma.transaction.findUnique({
        where: { id: data.transactionId },
        select: { buyerId: true, sellerId: true },
      });
      if (!transaction || (transaction.buyerId !== session.user.id && transaction.sellerId !== session.user.id)) {
        return NextResponse.json({ error: "Cannot add document to this transaction" }, { status: 403 });
      }
    }

    const document = await prisma.document.create({
      data: {
        ownerId: session.user.id,
        listingId: data.listingId,
        transactionId: data.transactionId,
        disputeId: data.disputeId,
        type: data.type,
        url: data.url,
        accessPolicy: data.accessPolicy,
        mimeType: data.mimeType,
        fileSizeBytes: data.fileSizeBytes ? BigInt(data.fileSizeBytes) : null,
        virusScanStatus: "PENDING",
        exifStripped: true,
        watermarked: false,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "DOCUMENT",
        entityId: document.id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "UPLOAD",
        diff: { type: data.type, listingId: data.listingId, transactionId: data.transactionId },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error uploading document:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}

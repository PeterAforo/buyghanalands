import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function canAccessDocument(userId: string, document: any): Promise<boolean> {
  // Owner always has access
  if (document.ownerId === userId) return true;

  // Check user roles
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });

  const isAdmin = user?.roles.some((r) => ["ADMIN", "MODERATOR", "COMPLIANCE"].includes(r));
  if (isAdmin) return true;

  // Check access policy
  switch (document.accessPolicy) {
    case "PUBLIC":
      return true;
    case "LOGGED_IN_REDACTED":
      return true; // Will return redacted version
    case "TRANSACTION_PARTIES":
      if (document.transactionId) {
        const transaction = await prisma.transaction.findUnique({
          where: { id: document.transactionId },
          select: { buyerId: true, sellerId: true },
        });
        return transaction?.buyerId === userId || transaction?.sellerId === userId;
      }
      if (document.listingId) {
        const listing = await prisma.listing.findUnique({
          where: { id: document.listingId },
          select: { sellerId: true },
        });
        if (listing?.sellerId === userId) return true;
        
        // Check if buyer has active transaction
        const hasTransaction = await prisma.transaction.findFirst({
          where: {
            listingId: document.listingId,
            buyerId: userId,
            status: { notIn: ["CLOSED", "REFUNDED"] },
          },
        });
        return !!hasTransaction;
      }
      return false;
    case "PRIVATE":
    default:
      return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, fullName: true } },
        listing: { select: { id: true, title: true } },
        transaction: { select: { id: true } },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const hasAccess = await canAccessDocument(session.user.id, document);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Log access
    await prisma.documentAccessLog.create({
      data: {
        documentId: id,
        userId: session.user.id,
        action: "VIEW",
        ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    // Return redacted URL if applicable
    const useRedacted = document.accessPolicy === "LOGGED_IN_REDACTED" && 
                        document.ownerId !== session.user.id &&
                        document.redactedUrl;

    return NextResponse.json({
      ...document,
      url: useRedacted ? document.redactedUrl : document.url,
      fileSizeBytes: document.fileSizeBytes?.toString(),
      isRedacted: useRedacted,
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
      select: { id: true, ownerId: true, type: true },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.ownerId !== session.user.id) {
      // Check if admin
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { roles: true },
      });
      if (!user?.roles.includes("ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await prisma.document.delete({ where: { id } });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "DOCUMENT",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "DELETE",
        diff: { type: document.type },
      },
    });

    return NextResponse.json({ message: "Document deleted" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}

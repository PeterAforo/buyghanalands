import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        transaction: {
          select: { buyerId: true, sellerId: true },
        },
        documents: {
          include: {
            owner: { select: { id: true, fullName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    // Check authorization
    const isBuyer = dispute.transaction.buyerId === session.user.id;
    const isSeller = dispute.transaction.sellerId === session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });
    const isAdmin = user?.roles.some((r) => ["ADMIN", "SUPPORT", "COMPLIANCE"].includes(r));

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      disputeId: id,
      evidence: dispute.documents.map((doc) => ({
        id: doc.id,
        type: doc.type,
        url: doc.url,
        mimeType: doc.mimeType,
        uploadedBy: doc.owner,
        uploadedAt: doc.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching dispute evidence:", error);
    return NextResponse.json({ error: "Failed to fetch evidence" }, { status: 500 });
  }
}

const uploadEvidenceSchema = z.object({
  url: z.string().url(),
  type: z.enum(["PHOTO", "DOCUMENT", "VIDEO", "OTHER"]).default("OTHER"),
  description: z.string().optional(),
  mimeType: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = uploadEvidenceSchema.parse(body);

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        transaction: {
          select: { buyerId: true, sellerId: true },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    // Check authorization - only parties or admin can upload evidence
    const isBuyer = dispute.transaction.buyerId === session.user.id;
    const isSeller = dispute.transaction.sellerId === session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });
    const isAdmin = user?.roles.some((r) => ["ADMIN", "SUPPORT"].includes(r));

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if dispute is still open for evidence
    if (!["OPEN", "UNDER_REVIEW", "MEDIATION"].includes(dispute.status)) {
      return NextResponse.json(
        { error: "Cannot add evidence to a closed dispute" },
        { status: 400 }
      );
    }

    // Create document as evidence
    const document = await prisma.document.create({
      data: {
        ownerId: session.user.id,
        disputeId: id,
        type: "OTHER",
        url: data.url,
        mimeType: data.mimeType,
        accessPolicy: "TRANSACTION_PARTIES",
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "DISPUTE",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "UPLOAD_EVIDENCE",
        diff: { documentId: document.id, description: data.description },
      },
    });

    return NextResponse.json({
      message: "Evidence uploaded successfully",
      document: {
        id: document.id,
        url: document.url,
        type: document.type,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error uploading evidence:", error);
    return NextResponse.json({ error: "Failed to upload evidence" }, { status: 500 });
  }
}

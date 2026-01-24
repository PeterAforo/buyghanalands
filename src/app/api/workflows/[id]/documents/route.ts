import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createDocumentSchema = z.object({
  category: z.string(),
  subcategory: z.string().optional(),
  documentType: z.string(),
  title: z.string(),
  description: z.string().optional(),
  fileUrl: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  expiryDate: z.string().optional(),
});

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
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    // Verify ownership
    const workflow = await prisma.propertyWorkflow.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    const documents = await prisma.workflowDocument.findMany({
      where: {
        propertyWorkflowId: id,
        ...(category && { category }),
      },
      orderBy: { createdAt: "desc" },
    });

    // Get category counts
    const categoryCounts = await prisma.workflowDocument.groupBy({
      by: ["category"],
      where: { propertyWorkflowId: id },
      _count: { category: true },
    });

    const categories = categoryCounts.map((c) => ({
      id: c.category,
      name: c.category,
      count: c._count.category,
    }));

    return NextResponse.json({ documents, categories });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

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
    const validatedData = createDocumentSchema.parse(body);

    // Verify ownership
    const workflow = await prisma.propertyWorkflow.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    // Check for existing document with same type to handle versioning
    const existingDoc = await prisma.workflowDocument.findFirst({
      where: {
        propertyWorkflowId: id,
        documentType: validatedData.documentType,
        category: validatedData.category,
      },
      orderBy: { version: "desc" },
    });

    const document = await prisma.workflowDocument.create({
      data: {
        propertyWorkflowId: id,
        category: validatedData.category,
        subcategory: validatedData.subcategory,
        documentType: validatedData.documentType,
        title: validatedData.title,
        description: validatedData.description,
        fileUrl: validatedData.fileUrl,
        fileName: validatedData.fileName,
        fileSize: validatedData.fileSize,
        mimeType: validatedData.mimeType,
        uploadedBy: session.user.id,
        version: existingDoc ? existingDoc.version + 1 : 1,
        previousVersionId: existingDoc?.id,
        expiryDate: validatedData.expiryDate
          ? new Date(validatedData.expiryDate)
          : null,
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
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
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const workflow = await prisma.propertyWorkflow.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    await prisma.workflowDocument.delete({
      where: {
        id: documentId,
        propertyWorkflowId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    // Verify permit ownership
    const permit = await prisma.permitApplication.findUnique({
      where: { id },
      select: { applicantId: true, status: true },
    });

    if (!permit) {
      return NextResponse.json({ error: "Permit not found" }, { status: 404 });
    }

    if (permit.applicantId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can only upload to draft or query_raised permits
    if (permit.status !== "DRAFT" && permit.status !== "QUERY_RAISED" && permit.status !== "RESUBMITTED") {
      return NextResponse.json({ error: "Cannot upload to this permit" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const docType = formData.get("type") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!docType) {
      return NextResponse.json({ error: "Document type required" }, { status: 400 });
    }

    // Upload to Vercel Blob
    const ext = file.name.split('.').pop() || 'bin';
    const filename = `permits/${id}/${docType}-${Date.now()}.${ext}`;

    const blob = await put(filename, file, {
      access: "public",
    });

    // Create document record
    const document = await prisma.permitDocument.create({
      data: {
        permitApplicationId: id,
        type: docType as any,
        documentId: null, // Link to Document model if needed
        url: blob.url,
        fileName: file.name,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error uploading permit document:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
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

    const permit = await prisma.permitApplication.findUnique({
      where: { id },
      select: { applicantId: true },
    });

    if (!permit) {
      return NextResponse.json({ error: "Permit not found" }, { status: 404 });
    }

    // Check authorization
    if (permit.applicantId !== session.user.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { roles: true },
      });
      if (!user?.roles.includes("ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const documents = await prisma.permitDocument.findMany({
      where: { permitApplicationId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching permit documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

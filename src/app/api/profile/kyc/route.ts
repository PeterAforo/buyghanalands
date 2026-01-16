import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { put } from "@vercel/blob";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        kycTier: true,
        kycDocuments: {
          select: {
            id: true,
            type: true,
            status: true,
            url: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      kycTier: user.kycTier,
      documents: user.kycDocuments,
    });
  } catch (error) {
    console.error("Error fetching KYC status:", error);
    return NextResponse.json({ error: "Failed to fetch KYC status" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const docType = formData.get("type") as string;

    if (!file || !docType) {
      return NextResponse.json({ error: "File and type are required" }, { status: 400 });
    }

    const validTypes = ["GHANA_CARD", "GHANA_CARD_BACK", "SELFIE", "PROOF_OF_ADDRESS"];
    if (!validTypes.includes(docType)) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum 10MB allowed." }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(`kyc/${session.user.id}/${docType}-${Date.now()}`, file, {
      access: "public",
    });

    // Delete existing document of same type
    await prisma.kYCDocument.deleteMany({
      where: {
        userId: session.user.id,
        type: docType,
      },
    });

    // Create new document record
    const document = await prisma.kYCDocument.create({
      data: {
        userId: session.user.id,
        type: docType,
        url: blob.url,
        status: "PENDING",
      },
    });

    // Update KYC tier if documents uploaded
    const allDocs = await prisma.kYCDocument.findMany({
      where: { userId: session.user.id },
    });

    const hasGhanaCard = allDocs.some((d) => d.type === "GHANA_CARD");
    const hasGhanaCardBack = allDocs.some((d) => d.type === "GHANA_CARD_BACK");
    const hasSelfie = allDocs.some((d) => d.type === "SELFIE");

    let newKycTier = "TIER_0_PHONE_ONLY";
    if (hasGhanaCard || hasGhanaCardBack || hasSelfie) {
      newKycTier = "TIER_1_ID_UPLOAD";
    }

    // Check if all required docs are approved
    const approvedDocs = allDocs.filter((d) => d.status === "APPROVED");
    const hasApprovedGhanaCard = approvedDocs.some((d) => d.type === "GHANA_CARD");
    const hasApprovedGhanaCardBack = approvedDocs.some((d) => d.type === "GHANA_CARD_BACK");
    const hasApprovedSelfie = approvedDocs.some((d) => d.type === "SELFIE");

    if (hasApprovedGhanaCard && hasApprovedGhanaCardBack && hasApprovedSelfie) {
      newKycTier = "TIER_2_GHANA_CARD";
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { kycTier: newKycTier },
    });

    return NextResponse.json({
      document: {
        id: document.id,
        type: document.type,
        status: document.status,
        url: document.url,
        createdAt: document.createdAt,
      },
      kycTier: newKycTier,
    });
  } catch (error) {
    console.error("Error uploading KYC document:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}

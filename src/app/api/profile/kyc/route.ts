import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { put } from "@vercel/blob";

// KYC document types stored in Document.metadata
const KYC_DOC_TYPES = ["GHANA_CARD", "GHANA_CARD_BACK", "SELFIE", "PROOF_OF_ADDRESS"];

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
        documents: {
          where: {
            type: "ID_DOCUMENT",
          },
          select: {
            id: true,
            type: true,
            url: true,
            metadata: true,
            verificationStatus: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Transform documents to include KYC type from metadata
    const kycDocuments = user.documents.map((doc) => ({
      id: doc.id,
      type: (doc.metadata as any)?.kycType || "UNKNOWN",
      status: doc.verificationStatus || "PENDING",
      url: doc.url,
      createdAt: doc.createdAt,
    }));

    return NextResponse.json({
      kycTier: user.kycTier,
      documents: kycDocuments,
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

    // Delete existing document of same type (using Document model with metadata)
    const existingDocs = await prisma.document.findMany({
      where: {
        ownerId: session.user.id,
        type: "ID_DOCUMENT",
      },
    });
    
    for (const doc of existingDocs) {
      if ((doc.metadata as any)?.kycType === docType) {
        await prisma.document.delete({ where: { id: doc.id } });
      }
    }

    // Create new document record using Document model
    const document = await prisma.document.create({
      data: {
        ownerId: session.user.id,
        type: "ID_DOCUMENT",
        url: blob.url,
        verificationStatus: "PENDING",
        metadata: { kycType: docType },
      },
    });

    // Update KYC tier if documents uploaded
    const allDocs = await prisma.document.findMany({
      where: { 
        ownerId: session.user.id,
        type: "ID_DOCUMENT",
      },
    });

    const hasGhanaCard = allDocs.some((d) => (d.metadata as any)?.kycType === "GHANA_CARD");
    const hasGhanaCardBack = allDocs.some((d) => (d.metadata as any)?.kycType === "GHANA_CARD_BACK");
    const hasSelfie = allDocs.some((d) => (d.metadata as any)?.kycType === "SELFIE");

    type KycTierType = "TIER_0_OTP" | "TIER_1_ID_UPLOAD" | "TIER_2_GHANA_CARD";
    let newKycTier: KycTierType = "TIER_0_OTP";
    if (hasGhanaCard || hasGhanaCardBack || hasSelfie) {
      newKycTier = "TIER_1_ID_UPLOAD";
    }

    // Check if all required docs are approved
    const approvedDocs = allDocs.filter((d) => d.verificationStatus === "APPROVED");
    const hasApprovedGhanaCard = approvedDocs.some((d) => (d.metadata as any)?.kycType === "GHANA_CARD");
    const hasApprovedGhanaCardBack = approvedDocs.some((d) => (d.metadata as any)?.kycType === "GHANA_CARD_BACK");
    const hasApprovedSelfie = approvedDocs.some((d) => (d.metadata as any)?.kycType === "SELFIE");

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
        type: docType,
        status: document.verificationStatus,
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

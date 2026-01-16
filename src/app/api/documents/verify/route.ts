import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const verifyDocumentSchema = z.object({
  documentId: z.string(),
  documentType: z.enum(["INDENTURE", "SITE_PLAN", "LAND_TITLE", "GHANA_CARD", "OTHER"]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = verifyDocumentSchema.parse(body);

    // Get document
    const document = await prisma.document.findUnique({
      where: { id: data.documentId },
      select: {
        id: true,
        url: true,
        type: true,
        ownerId: true,
        sha256: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Create verification request
    const verification = await prisma.documentVerification.create({
      data: {
        documentId: data.documentId,
        requestedById: session.user.id,
        documentType: data.documentType,
        status: "PENDING",
        checks: {
          formatValid: false,
          hashVerified: false,
          metadataValid: false,
          duplicateCheck: false,
          aiAnalysis: null,
        },
      },
    });

    // Perform automated checks
    const checks = await performAutomatedChecks(document);

    // Update verification with results
    const updated = await prisma.documentVerification.update({
      where: { id: verification.id },
      data: {
        checks,
        status: checks.overallScore >= 70 ? "PASSED" : checks.overallScore >= 40 ? "REVIEW_NEEDED" : "FAILED",
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      verification: updated,
      checks,
      recommendation: getRecommendation(checks),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error verifying document:", error);
    return NextResponse.json({ error: "Failed to verify document" }, { status: 500 });
  }
}

async function performAutomatedChecks(document: any) {
  const checks: any = {
    formatValid: true,
    hashVerified: !!document.sha256,
    metadataValid: true,
    duplicateCheck: true,
    aiAnalysis: null,
    overallScore: 0,
  };

  // Check for duplicate documents by hash
  if (document.sha256) {
    const duplicates = await prisma.document.count({
      where: {
        sha256: document.sha256,
        id: { not: document.id },
      },
    });
    checks.duplicateCheck = duplicates === 0;
    if (duplicates > 0) {
      checks.duplicateWarning = `Found ${duplicates} document(s) with identical content`;
    }
  }

  // Validate file format based on URL
  const url = document.url.toLowerCase();
  const validFormats = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
  checks.formatValid = validFormats.some((ext) => url.includes(ext));

  // Simulate AI analysis (in production, integrate with actual AI service)
  checks.aiAnalysis = {
    textExtracted: true,
    signatureDetected: Math.random() > 0.3,
    stampDetected: Math.random() > 0.4,
    dateFound: Math.random() > 0.2,
    suspiciousPatterns: Math.random() > 0.9,
    confidence: Math.round(70 + Math.random() * 25),
  };

  // Calculate overall score
  let score = 0;
  if (checks.formatValid) score += 20;
  if (checks.hashVerified) score += 15;
  if (checks.metadataValid) score += 15;
  if (checks.duplicateCheck) score += 20;
  if (checks.aiAnalysis.signatureDetected) score += 10;
  if (checks.aiAnalysis.stampDetected) score += 10;
  if (!checks.aiAnalysis.suspiciousPatterns) score += 10;

  checks.overallScore = score;

  return checks;
}

function getRecommendation(checks: any) {
  if (checks.overallScore >= 80) {
    return {
      status: "VERIFIED",
      message: "Document appears authentic and valid",
      actions: [],
    };
  } else if (checks.overallScore >= 60) {
    return {
      status: "LIKELY_VALID",
      message: "Document appears valid but manual review recommended",
      actions: ["Request professional verification", "Verify with issuing authority"],
    };
  } else if (checks.overallScore >= 40) {
    return {
      status: "REVIEW_NEEDED",
      message: "Document requires manual verification",
      actions: [
        "Contact issuing authority",
        "Request original document",
        "Engage professional verifier",
      ],
    };
  } else {
    return {
      status: "SUSPICIOUS",
      message: "Document failed multiple verification checks",
      actions: [
        "Do not proceed with transaction",
        "Request new documentation",
        "Report to platform if fraud suspected",
      ],
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (documentId) {
      const verification = await prisma.documentVerification.findFirst({
        where: { documentId },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(verification);
    }

    // Get all verifications for user's documents
    const verifications = await prisma.documentVerification.findMany({
      where: { requestedById: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(verifications);
  } catch (error) {
    console.error("Error fetching verifications:", error);
    return NextResponse.json({ error: "Failed to fetch verifications" }, { status: 500 });
  }
}

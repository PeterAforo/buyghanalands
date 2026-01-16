import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createClaimSchema = z.object({
  insuranceId: z.string(),
  reason: z.enum(["FRAUD", "TITLE_ISSUE", "DOCUMENT_FORGERY", "SELLER_DEFAULT", "OTHER"]),
  description: z.string().min(50),
  evidenceUrls: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createClaimSchema.parse(body);

    // Get insurance
    const insurance = await prisma.escrowInsurance.findUnique({
      where: { id: data.insuranceId },
      include: {
        transaction: true,
      },
    });

    if (!insurance) {
      return NextResponse.json({ error: "Insurance not found" }, { status: 404 });
    }

    // Only buyer can file claim
    if (insurance.buyerId !== session.user.id) {
      return NextResponse.json({ error: "Only buyer can file a claim" }, { status: 403 });
    }

    // Check insurance is active
    if (insurance.status !== "ACTIVE") {
      return NextResponse.json({ error: "Insurance is not active" }, { status: 400 });
    }

    // Check not expired
    if (insurance.expiresAt && insurance.expiresAt < new Date()) {
      return NextResponse.json({ error: "Insurance has expired" }, { status: 400 });
    }

    // Create claim
    const claim = await prisma.insuranceClaim.create({
      data: {
        insuranceId: data.insuranceId,
        claimantId: session.user.id,
        reason: data.reason,
        description: data.description,
        evidenceUrls: data.evidenceUrls || [],
        status: "SUBMITTED",
        claimAmountGhs: insurance.coverageAmountGhs,
      },
    });

    // Update insurance status
    await prisma.escrowInsurance.update({
      where: { id: data.insuranceId },
      data: { status: "CLAIM_FILED" },
    });

    return NextResponse.json(claim, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error filing claim:", error);
    return NextResponse.json({ error: "Failed to file claim" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const claims = await prisma.insuranceClaim.findMany({
      where: { claimantId: session.user.id },
      include: {
        insurance: {
          include: {
            transaction: {
              select: {
                listing: { select: { title: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(claims);
  } catch (error) {
    console.error("Error fetching claims:", error);
    return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 });
  }
}

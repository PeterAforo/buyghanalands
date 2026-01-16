import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const verificationRequestSchema = z.object({
  businessName: z.string().optional(),
  businessRegistrationNumber: z.string().optional(),
  tinNumber: z.string().optional(),
  physicalAddress: z.string(),
  yearsInBusiness: z.number().min(0),
  totalLandsSold: z.number().min(0),
  references: z.array(z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string(),
  })).min(1).max(3),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's verification status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        kycTier: true,
        verificationRequests: {
          where: { type: "SELLER_VERIFICATION" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const latestRequest = user?.verificationRequests[0];

    // Check if user has verified seller badge
    const sellerBadge = await prisma.sellerBadge.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      kycTier: user?.kycTier,
      verificationRequest: latestRequest,
      badge: sellerBadge,
      isVerified: sellerBadge?.status === "ACTIVE",
    });
  } catch (error) {
    console.error("Error fetching verification status:", error);
    return NextResponse.json({ error: "Failed to fetch verification status" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = verificationRequestSchema.parse(body);

    // Check if user already has pending request
    const existingRequest = await prisma.verificationRequest.findFirst({
      where: {
        userId: session.user.id,
        type: "SELLER_VERIFICATION",
        status: { in: ["PENDING", "IN_REVIEW"] },
      },
    });

    if (existingRequest) {
      return NextResponse.json({ error: "You already have a pending verification request" }, { status: 400 });
    }

    // Check if already verified
    const existingBadge = await prisma.sellerBadge.findUnique({
      where: { userId: session.user.id },
    });

    if (existingBadge?.status === "ACTIVE") {
      return NextResponse.json({ error: "You are already a verified seller" }, { status: 400 });
    }

    // Create verification request
    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        userId: session.user.id,
        type: "SELLER_VERIFICATION",
        status: "PENDING",
        metadata: {
          businessName: data.businessName,
          businessRegistrationNumber: data.businessRegistrationNumber,
          tinNumber: data.tinNumber,
          physicalAddress: data.physicalAddress,
          yearsInBusiness: data.yearsInBusiness,
          totalLandsSold: data.totalLandsSold,
          references: data.references,
        },
      },
    });

    return NextResponse.json(verificationRequest, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error creating verification request:", error);
    return NextResponse.json({ error: "Failed to create verification request" }, { status: 500 });
  }
}

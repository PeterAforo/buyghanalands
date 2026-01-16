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

    // Get user's KYC tier
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { kycTier: true },
    });

    // Check if user has verified seller badge
    const sellerBadge = await prisma.sellerBadge.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      kycTier: user?.kycTier,
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

    // Check if already verified
    const existingBadge = await prisma.sellerBadge.findUnique({
      where: { userId: session.user.id },
    });

    if (existingBadge?.status === "ACTIVE") {
      return NextResponse.json({ error: "You are already a verified seller" }, { status: 400 });
    }

    // Create or update seller badge with pending status
    const badge = await prisma.sellerBadge.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        level: "BRONZE",
        status: "EXPIRED", // Use EXPIRED as pending state
        issuedAt: new Date(),
      },
      update: {
        status: "EXPIRED", // Pending review
      },
    });

    // Store verification data in audit log for admin review
    await prisma.auditLog.create({
      data: {
        entityType: "USER",
        entityId: session.user.id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "SELLER_VERIFICATION_REQUEST",
        diff: {
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

    return NextResponse.json({ 
      message: "Verification request submitted",
      badge,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error creating verification request:", error);
    return NextResponse.json({ error: "Failed to create verification request" }, { status: 500 });
  }
}

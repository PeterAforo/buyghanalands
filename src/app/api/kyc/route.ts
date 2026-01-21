import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's KYC requests
    const kycRequests = await prisma.kycRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(kycRequests);
  } catch (error) {
    console.error("Error fetching KYC requests:", error);
    return NextResponse.json({ error: "Failed to fetch KYC requests" }, { status: 500 });
  }
}

const initiateKycSchema = z.object({
  ghanaCardNumber: z.string().min(10).max(20),
  selfieUrl: z.string().url().optional(),
  reason: z.enum(["SELLER_VERIFICATION", "HIGH_VALUE_TRANSACTION", "PROFESSIONAL_REGISTRATION", "MANUAL_REQUEST"]).default("MANUAL_REQUEST"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = initiateKycSchema.parse(body);

    // Check for existing pending KYC request
    const existingRequest = await prisma.kycRequest.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["INITIATED", "PENDING", "MANUAL_REVIEW"] },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "A KYC verification is already in progress" },
        { status: 400 }
      );
    }

    // Create KYC request
    const kycRequest = await prisma.kycRequest.create({
      data: {
        userId: session.user.id,
        ghanaCardNumber: data.ghanaCardNumber,
        selfieUrl: data.selfieUrl,
        reason: data.reason,
        status: "INITIATED",
      },
    });

    // In production, this would call the Ghana Card verification API
    // For now, we'll simulate by setting to PENDING
    await prisma.kycRequest.update({
      where: { id: kycRequest.id },
      data: { status: "PENDING" },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "KYC_REQUEST",
        entityId: kycRequest.id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "INITIATE",
        diff: { reason: data.reason },
      },
    });

    return NextResponse.json({
      message: "KYC verification initiated",
      request: kycRequest,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error initiating KYC:", error);
    return NextResponse.json({ error: "Failed to initiate KYC" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function isCompliance(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.some((role) => ["ADMIN", "COMPLIANCE"].includes(role)) || false;
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

    if (!(await isCompliance(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const kycRequest = await prisma.kycRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            kycTier: true,
            accountStatus: true,
            createdAt: true,
            _count: {
              select: {
                listings: true,
                transactionsAsBuyer: true,
                transactionsAsSeller: true,
              },
            },
          },
        },
      },
    });

    if (!kycRequest) {
      return NextResponse.json({ error: "KYC request not found" }, { status: 404 });
    }

    return NextResponse.json(kycRequest);
  } catch (error) {
    console.error("Error fetching KYC request:", error);
    return NextResponse.json({ error: "Failed to fetch KYC request" }, { status: 500 });
  }
}

const reviewKycSchema = z.object({
  action: z.enum(["approve", "reject", "request_retry"]),
  notes: z.string().optional(),
  newKycTier: z.enum(["TIER_0_OTP", "TIER_1_ID_UPLOADED", "TIER_2_GHANA_CARD"]).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isCompliance(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = reviewKycSchema.parse(body);

    const kycRequest = await prisma.kycRequest.findUnique({
      where: { id },
      select: { id: true, status: true, userId: true },
    });

    if (!kycRequest) {
      return NextResponse.json({ error: "KYC request not found" }, { status: 404 });
    }

    let newStatus: string;
    let newKycTier: string | undefined;

    switch (data.action) {
      case "approve":
        newStatus = "PASSED";
        newKycTier = data.newKycTier || "TIER_2_GHANA_CARD";
        break;
      case "reject":
        newStatus = "FAILED";
        break;
      case "request_retry":
        newStatus = "RETRY";
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Update KYC request
    const updated = await prisma.kycRequest.update({
      where: { id },
      data: {
        status: newStatus as any,
        reviewNotes: data.notes,
        reviewedById: session.user.id,
        completedAt: newStatus === "PASSED" || newStatus === "FAILED" ? new Date() : undefined,
      },
    });

    // Update user's KYC tier if approved
    if (newStatus === "PASSED" && newKycTier) {
      await prisma.user.update({
        where: { id: kycRequest.userId },
        data: { kycTier: newKycTier as any },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "KYC_REQUEST",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: `KYC_${data.action.toUpperCase()}`,
        diff: {
          previousStatus: kycRequest.status,
          newStatus,
          newKycTier,
          notes: data.notes,
        },
      },
    });

    return NextResponse.json({
      message: `KYC request ${data.action}d`,
      request: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error reviewing KYC request:", error);
    return NextResponse.json({ error: "Failed to review KYC request" }, { status: 500 });
  }
}

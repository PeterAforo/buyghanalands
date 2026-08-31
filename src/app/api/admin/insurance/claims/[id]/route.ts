import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await withDbRetry(() => prisma.user.findUnique({ where: { id: userId }, select: { roles: true } }));
  return user?.roles.some((r) => ["ADMIN", "FINANCE", "COMPLIANCE"].includes(r)) || false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await isAdmin(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const claim = await withDbRetry(() => prisma.insuranceClaim.findUnique({
      where: { id },
      include: {
        insurance: {
          include: {
            transaction: { select: { id: true, status: true, listing: { select: { id: true, title: true } } } },
          },
        },
        claimant: { select: { id: true, fullName: true, email: true, phone: true, kycTier: true } },
      },
    }));

    if (!claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    return NextResponse.json(serializeForJson(claim));
  } catch (error) {
    console.error("Error fetching insurance claim:", error);
    return NextResponse.json({ error: "Failed to fetch claim" }, { status: 500 });
  }
}

const reviewSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "APPROVED", "REJECTED", "PAID"]),
  reviewNote: z.string().optional(),
  approvedAmount: z.number().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await isAdmin(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const data = reviewSchema.parse(body);

    const claim = await withDbRetry(() => prisma.insuranceClaim.findUnique({ where: { id }, select: { id: true, status: true } }));
    if (!claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });

    const updateData: any = {
      status: data.status,
      reviewNote: data.reviewNote,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    };
    if (data.status === "APPROVED" && data.approvedAmount) {
      updateData.approvedAmountGhs = data.approvedAmount;
    }
    if (data.status === "PAID") {
      updateData.paidAt = new Date();
    }

    const updated = await withDbRetry(() => prisma.insuranceClaim.update({ where: { id }, data: updateData }));

    await withDbRetry(() => prisma.auditLog.create({
      data: {
        entityType: "INSURANCE_CLAIM",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: `CLAIM_${data.status}`,
        diff: { from: claim.status, to: data.status, note: data.reviewNote, approvedAmount: data.approvedAmount },
      },
    }));

    return NextResponse.json(serializeForJson(updated));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error updating insurance claim:", error);
    return NextResponse.json({ error: "Failed to update claim" }, { status: 500 });
  }
}

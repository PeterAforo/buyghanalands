import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    const kycRequest = await prisma.kycRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, fullName: true, phone: true, kycTier: true },
        },
      },
    });

    if (!kycRequest) {
      return NextResponse.json({ error: "KYC request not found" }, { status: 404 });
    }

    // Check authorization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });

    const isAdmin = user?.roles.some((r) => ["ADMIN", "COMPLIANCE"].includes(r));
    if (kycRequest.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Hide sensitive data for non-admin
    if (!isAdmin) {
      return NextResponse.json({
        id: kycRequest.id,
        status: kycRequest.status,
        reason: kycRequest.reason,
        createdAt: kycRequest.createdAt,
        completedAt: kycRequest.completedAt,
      });
    }

    return NextResponse.json(kycRequest);
  } catch (error) {
    console.error("Error fetching KYC request:", error);
    return NextResponse.json({ error: "Failed to fetch KYC request" }, { status: 500 });
  }
}

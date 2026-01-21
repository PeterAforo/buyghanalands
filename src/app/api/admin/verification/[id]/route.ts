import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function isVerifier(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.some((role) => ["ADMIN", "MODERATOR", "COMPLIANCE"].includes(role)) || false;
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

    if (!(await isVerifier(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const verificationRequest = await prisma.verificationRequest.findUnique({
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
          },
        },
        listing: {
          include: {
            media: true,
            documents: true,
            boundaries: true,
            seller: { select: { id: true, fullName: true, kycTier: true } },
          },
        },
        assignedTo: { select: { id: true, fullName: true } },
      },
    });

    if (!verificationRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...verificationRequest,
      listing: verificationRequest.listing ? {
        ...verificationRequest.listing,
        priceGhs: verificationRequest.listing.priceGhs.toString(),
        sizeAcres: verificationRequest.listing.sizeAcres.toString(),
        latitude: verificationRequest.listing.latitude?.toString(),
        longitude: verificationRequest.listing.longitude?.toString(),
      } : null,
    });
  } catch (error) {
    console.error("Error fetching verification request:", error);
    return NextResponse.json({ error: "Failed to fetch request" }, { status: 500 });
  }
}

const reviewSchema = z.object({
  action: z.enum(["approve", "reject", "request_changes"]),
  checklist: z.array(z.object({
    id: z.string(),
    label: z.string(),
    checked: z.boolean(),
  })).optional(),
  outcomeNotes: z.string().optional(),
  referenceNo: z.string().optional(),
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

    if (!(await isVerifier(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = reviewSchema.parse(body);

    const verificationRequest = await prisma.verificationRequest.findUnique({
      where: { id },
      include: {
        listing: { select: { id: true, sellerId: true, title: true, verificationLevel: true } },
      },
    });

    if (!verificationRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (verificationRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Request already processed" }, { status: 400 });
    }

    let newStatus: "COMPLETED" | "REJECTED" | "CANCELLED";
    let newVerificationLevel = verificationRequest.listing?.verificationLevel || "LEVEL_0_UNVERIFIED";

    switch (data.action) {
      case "approve":
        newStatus = "COMPLETED";
        newVerificationLevel = verificationRequest.levelRequested;
        break;
      case "reject":
        newStatus = "REJECTED";
        break;
      case "request_changes":
        newStatus = "CANCELLED";
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Update verification request
    const updated = await prisma.verificationRequest.update({
      where: { id },
      data: {
        status: newStatus,
        checklist: data.checklist || verificationRequest.checklist,
        outcomeNotes: data.outcomeNotes,
        referenceNo: data.referenceNo,
        completedAt: new Date(),
      },
    });

    // Update listing verification level if approved
    if (data.action === "approve" && verificationRequest.listing) {
      await prisma.listing.update({
        where: { id: verificationRequest.listing.id },
        data: { verificationLevel: newVerificationLevel as any },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "VERIFICATION_REQUEST",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: `REVIEW_${data.action.toUpperCase()}`,
        diff: {
          previousStatus: verificationRequest.status,
          newStatus,
          levelRequested: verificationRequest.levelRequested,
          outcomeNotes: data.outcomeNotes,
        },
      },
    });

    // TODO: Send notification to seller about verification outcome

    return NextResponse.json({
      message: `Verification request ${data.action}ed`,
      request: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error reviewing verification request:", error);
    return NextResponse.json({ error: "Failed to review request" }, { status: 500 });
  }
}

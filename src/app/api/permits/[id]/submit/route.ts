import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const permit = await prisma.permitApplication.findUnique({
      where: { id },
      include: {
        documents: true,
        payments: { where: { status: "SUCCESS" } },
      },
    });

    if (!permit) {
      return NextResponse.json({ error: "Permit not found" }, { status: 404 });
    }

    if (permit.applicantId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (permit.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft applications can be submitted" },
        { status: 400 }
      );
    }

    // Check minimum required documents
    const requiredDocs = ["SITE_PLAN", "ARCHITECTURAL_DRAWINGS", "OWNERSHIP_DOCS"];
    const uploadedTypes = permit.documents.map((d) => d.type);
    const missingDocs = requiredDocs.filter((t) => !uploadedTypes.includes(t as any));

    if (missingDocs.length > 0) {
      return NextResponse.json(
        { error: `Missing required documents: ${missingDocs.join(", ")}` },
        { status: 400 }
      );
    }

    // Update status
    const updated = await prisma.permitApplication.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    // Create status history
    await prisma.permitStatusHistory.create({
      data: {
        permitApplicationId: id,
        fromStatus: "DRAFT",
        toStatus: "SUBMITTED",
        note: "Application submitted by applicant",
        changedById: session.user.id,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "PERMIT_APPLICATION",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "SUBMIT",
        diff: { documentsCount: permit.documents.length },
      },
    });

    return NextResponse.json({
      message: "Application submitted successfully",
      permit: {
        ...updated,
        estimatedCostGhs: updated.estimatedCostGhs?.toString(),
      },
    });
  } catch (error) {
    console.error("Error submitting permit:", error);
    return NextResponse.json({ error: "Failed to submit permit" }, { status: 500 });
  }
}

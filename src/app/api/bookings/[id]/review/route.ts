import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10).max(500).optional(),
});

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
    const body = await request.json();
    const data = createReviewSchema.parse(body);

    // Get service request with booking
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      select: {
        requesterId: true,
        professionalId: true,
        status: true,
        booking: {
          select: {
            id: true,
            reviews: true,
          },
        },
      },
    });

    if (!serviceRequest) {
      return NextResponse.json({ error: "Service request not found" }, { status: 404 });
    }

    // Only requester can review
    if (serviceRequest.requesterId !== session.user.id) {
      return NextResponse.json({ error: "Only requester can review" }, { status: 403 });
    }

    // Must be completed or delivered
    if (serviceRequest.status !== "COMPLETED" && serviceRequest.status !== "DELIVERED") {
      return NextResponse.json({ error: "Can only review completed requests" }, { status: 400 });
    }

    if (!serviceRequest.professionalId) {
      return NextResponse.json({ error: "No professional assigned" }, { status: 400 });
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findFirst({
      where: {
        reviewerId: session.user.id,
        professionalId: serviceRequest.professionalId,
        bookingId: serviceRequest.booking?.id,
      },
    });

    if (existingReview) {
      return NextResponse.json({ error: "Already reviewed" }, { status: 400 });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        reviewerId: session.user.id,
        professionalId: serviceRequest.professionalId,
        bookingId: serviceRequest.booking?.id,
        rating: data.rating,
        comment: data.comment,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}

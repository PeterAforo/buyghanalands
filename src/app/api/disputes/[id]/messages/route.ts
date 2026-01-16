import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const messageSchema = z.object({
  content: z.string().min(1).max(2000),
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

    const { id: disputeId } = await params;
    const body = await request.json();
    const data = messageSchema.parse(body);

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        transaction: true,
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    // Check authorization
    const isBuyer = dispute.transaction.buyerId === session.user.id;
    const isSeller = dispute.transaction.sellerId === session.user.id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Determine sender type and receiver
    const senderType = isBuyer ? "BUYER" : "SELLER";
    const receiverId = isBuyer ? dispute.transaction.sellerId : dispute.transaction.buyerId;

    // Use the Message model with transactionId to link to dispute
    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        transactionId: dispute.transactionId,
        body: `[Dispute #${disputeId.slice(0, 8)}] ${data.content}`,
      },
      include: {
        sender: { select: { fullName: true } },
      },
    });

    return NextResponse.json({
      id: message.id,
      content: data.content,
      senderType,
      senderId: session.user.id,
      createdAt: message.createdAt,
      sender: message.sender,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

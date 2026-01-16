import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.some((role) => ["ADMIN", "SUPPORT", "MODERATOR"].includes(role)) || false;
}

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

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: disputeId } = await params;
    const body = await request.json();
    const data = messageSchema.parse(body);

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { transaction: true },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    // Use the Message model with transactionId to link to dispute
    // Send to both buyer and seller
    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: dispute.transaction.buyerId, // Primary recipient
        transactionId: dispute.transactionId,
        body: `[ADMIN - Dispute #${disputeId.slice(0, 8)}] ${data.content}`,
      },
      include: {
        sender: { select: { fullName: true } },
      },
    });

    // Also send to seller
    await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: dispute.transaction.sellerId,
        transactionId: dispute.transactionId,
        body: `[ADMIN - Dispute #${disputeId.slice(0, 8)}] ${data.content}`,
      },
    });

    return NextResponse.json({
      id: message.id,
      content: data.content,
      senderType: "ADMIN",
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

    console.error("Error creating admin message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

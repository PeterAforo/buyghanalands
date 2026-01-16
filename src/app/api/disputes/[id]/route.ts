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

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        transaction: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                media: { take: 1 },
              },
            },
            buyer: { select: { id: true, fullName: true } },
            seller: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    // Fetch messages related to this dispute's transaction
    const messages = await prisma.message.findMany({
      where: {
        transactionId: dispute.transactionId,
        body: { contains: `[Dispute #${id.slice(0, 8)}]` },
      },
      include: {
        sender: { select: { fullName: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Transform messages to include senderType
    const transformedMessages = messages.map((msg) => {
      let senderType: "BUYER" | "SELLER" | "ADMIN" = "ADMIN";
      if (msg.senderId === dispute.transaction.buyerId) senderType = "BUYER";
      else if (msg.senderId === dispute.transaction.sellerId) senderType = "SELLER";
      
      return {
        id: msg.id,
        content: msg.body.replace(`[Dispute #${id.slice(0, 8)}] `, "").replace(`[ADMIN - Dispute #${id.slice(0, 8)}] `, ""),
        senderType,
        senderId: msg.senderId,
        createdAt: msg.createdAt,
        sender: msg.sender,
      };
    });

    // Check authorization
    const isBuyer = dispute.transaction.buyerId === session.user.id;
    const isSeller = dispute.transaction.sellerId === session.user.id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      ...dispute,
      transaction: {
        ...dispute.transaction,
        agreedPriceGhs: dispute.transaction.agreedPriceGhs.toString(),
      },
      messages: transformedMessages,
    });
  } catch (error) {
    console.error("Error fetching dispute:", error);
    return NextResponse.json({ error: "Failed to fetch dispute" }, { status: 500 });
  }
}

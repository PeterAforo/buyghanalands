import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all unique conversations
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id },
        ],
      },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
        receiver: { select: { id: true, fullName: true, avatarUrl: true } },
        listing: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by conversation partner
    const conversationsMap = new Map<string, {
      partnerId: string;
      partnerName: string;
      partnerAvatar: string | null;
      lastMessage: string;
      lastMessageAt: Date;
      unreadCount: number;
      listingId?: string;
      listingTitle?: string;
    }>();

    for (const msg of messages) {
      const partnerId = msg.senderId === session.user.id ? msg.receiverId : msg.senderId;
      const partner = msg.senderId === session.user.id ? msg.receiver : msg.sender;
      
      if (!conversationsMap.has(partnerId)) {
        // Count unread messages from this partner
        const unreadCount = messages.filter(
          m => m.senderId === partnerId && m.receiverId === session.user.id && !m.readAt
        ).length;

        conversationsMap.set(partnerId, {
          partnerId,
          partnerName: partner.fullName,
          partnerAvatar: partner.avatarUrl,
          lastMessage: msg.body,
          lastMessageAt: msg.createdAt,
          unreadCount,
          listingId: msg.listing?.id,
          listingTitle: msg.listing?.title,
        });
      }
    }

    const conversations = Array.from(conversationsMap.values());

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

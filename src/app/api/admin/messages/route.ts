import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.some((role) => ["ADMIN", "SUPPORT", "MODERATOR"].includes(role)) || false;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    // Get recent messages grouped by sender-receiver-listing combination
    const messages = await prisma.message.findMany({
      where: search ? {
        OR: [
          { listing: { title: { contains: search, mode: "insensitive" } } },
          { sender: { fullName: { contains: search, mode: "insensitive" } } },
          { receiver: { fullName: { contains: search, mode: "insensitive" } } },
        ],
      } : {},
      include: {
        listing: {
          select: { id: true, title: true },
        },
        sender: {
          select: { id: true, fullName: true, phone: true },
        },
        receiver: {
          select: { id: true, fullName: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Group messages into conversations
    const conversationMap = new Map<string, {
      id: string;
      listing: { id: string; title: string } | null;
      participants: { id: string; fullName: string; phone: string }[];
      lastMessage: string;
      lastMessageAt: string;
      messageCount: number;
    }>();

    messages.forEach((msg) => {
      const key = [msg.senderId, msg.receiverId, msg.listingId || "no-listing"].sort().join("-");
      
      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          id: key,
          listing: msg.listing,
          participants: [msg.sender, msg.receiver],
          lastMessage: msg.body.substring(0, 100),
          lastMessageAt: msg.createdAt.toISOString(),
          messageCount: 1,
        });
      } else {
        const conv = conversationMap.get(key)!;
        conv.messageCount++;
      }
    });

    return NextResponse.json(Array.from(conversationMap.values()));
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

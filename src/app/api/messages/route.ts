import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createMessageSchema = z.object({
  receiverId: z.string().min(1),
  body: z.string().min(1),
  listingId: z.string().optional(),
  transactionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createMessageSchema.parse(body);

    if (data.receiverId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot send message to yourself" },
        { status: 400 }
      );
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: data.receiverId },
      select: { id: true },
    });

    if (!receiver) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: data.receiverId,
        body: data.body,
        listingId: data.listingId,
        transactionId: data.transactionId,
      },
      include: {
        sender: { select: { id: true, fullName: true } },
        receiver: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationWith = searchParams.get("with");
    const listingId = searchParams.get("listingId");
    const transactionId = searchParams.get("transactionId");

    let where: any = {
      OR: [{ senderId: session.user.id }, { receiverId: session.user.id }],
    };

    if (conversationWith) {
      where = {
        OR: [
          { senderId: session.user.id, receiverId: conversationWith },
          { senderId: conversationWith, receiverId: session.user.id },
        ],
      };
    }

    if (listingId) where.listingId = listingId;
    if (transactionId) where.transactionId = transactionId;

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
        receiver: { select: { id: true, fullName: true, avatarUrl: true } },
        listing: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    // Mark messages as read
    if (conversationWith) {
      await prisma.message.updateMany({
        where: {
          senderId: conversationWith,
          receiverId: session.user.id,
          readAt: null,
        },
        data: { readAt: new Date() },
      });
    }

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

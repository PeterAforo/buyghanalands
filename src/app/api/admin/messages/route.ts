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

    let where: any = {};

    if (search) {
      where.OR = [
        { listing: { title: { contains: search, mode: "insensitive" } } },
        { buyer: { fullName: { contains: search, mode: "insensitive" } } },
        { seller: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        listing: {
          select: { id: true, title: true },
        },
        buyer: {
          select: { id: true, fullName: true, phone: true },
        },
        seller: {
          select: { id: true, fullName: true, phone: true },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 100,
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

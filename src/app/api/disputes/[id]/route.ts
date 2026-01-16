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
        messages: {
          include: {
            sender: { select: { fullName: true } },
          },
          orderBy: { createdAt: "asc" },
        },
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

    return NextResponse.json({
      ...dispute,
      transaction: {
        ...dispute.transaction,
        agreedPriceGhs: dispute.transaction.agreedPriceGhs.toString(),
      },
    });
  } catch (error) {
    console.error("Error fetching dispute:", error);
    return NextResponse.json({ error: "Failed to fetch dispute" }, { status: 500 });
  }
}

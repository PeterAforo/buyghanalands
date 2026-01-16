import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const disputes = await prisma.dispute.findMany({
      where: {
        OR: [
          { transaction: { buyerId: session.user.id } },
          { transaction: { sellerId: session.user.id } },
        ],
      },
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      disputes.map((d) => ({
        ...d,
        transaction: {
          ...d.transaction,
          agreedPriceGhs: d.transaction.agreedPriceGhs.toString(),
        },
      }))
    );
  } catch (error) {
    console.error("Error fetching disputes:", error);
    return NextResponse.json({ error: "Failed to fetch disputes" }, { status: 500 });
  }
}

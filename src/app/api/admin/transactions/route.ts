import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.some((role) => ["ADMIN", "SUPPORT", "MODERATOR"].includes(role)) || false;
}

const bulkActionSchema = z.object({
  action: z.enum(["release", "refund", "close"]),
  transactionIds: z.array(z.string()).min(1, "At least one transaction ID required"),
});

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
    const filter = searchParams.get("filter") || "all";
    const search = searchParams.get("search") || "";

    let where: any = {};

    switch (filter) {
      case "funded":
        where.status = "FUNDED";
        break;
      case "released":
        where.status = "RELEASED";
        break;
      case "disputed":
        where.status = "DISPUTED";
        break;
      case "pending":
        where.status = { in: ["CREATED", "ESCROW_REQUESTED", "VERIFICATION_PERIOD"] };
        break;
      case "all":
        break;
    }

    if (search) {
      where.OR = [
        { listing: { title: { contains: search, mode: "insensitive" } } },
        { buyer: { fullName: { contains: search, mode: "insensitive" } } },
        { seller: { fullName: { contains: search, mode: "insensitive" } } },
        { id: { contains: search, mode: "insensitive" } },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        listing: { select: { id: true, title: true, region: true, district: true } },
        buyer: { select: { id: true, fullName: true, phone: true } },
        seller: { select: { id: true, fullName: true, phone: true } },
        payments: { select: { id: true, amount: true, status: true, type: true } },
        disputes: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(
      transactions.map((tx) => ({
        ...tx,
        agreedPriceGhs: tx.agreedPriceGhs.toString(),
        platformFeeGhs: tx.platformFeeGhs.toString(),
        sellerNetGhs: tx.sellerNetGhs.toString(),
        payments: tx.payments.map((p) => ({
          ...p,
          amount: p.amount.toString(),
        })),
      }))
    );
  } catch (error) {
    console.error("Error fetching admin transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

// Bulk actions for transactions
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action, transactionIds } = bulkActionSchema.parse(body);

    const statusMap: Record<string, string> = {
      release: "RELEASED",
      refund: "REFUNDED",
      close: "CLOSED",
    };

    const result = await prisma.transaction.updateMany({
      where: { id: { in: transactionIds } },
      data: { 
        status: statusMap[action] as any,
        completedAt: action === "release" || action === "close" ? new Date() : undefined,
      },
    });

    // Create audit logs
    for (const txId of transactionIds) {
      await prisma.auditLog.create({
        data: {
          entityType: "TRANSACTION",
          entityId: txId,
          actorType: "USER",
          actorUserId: session.user.id,
          action: `TRANSACTION_BULK_${action.toUpperCase()}`,
          diff: { newStatus: statusMap[action] },
        },
      });
    }

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error performing bulk action:", error);
    return NextResponse.json({ error: "Failed to perform bulk action" }, { status: 500 });
  }
}

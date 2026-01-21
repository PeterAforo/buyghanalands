import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = { userId: session.user.id };
    if (status) where.status = status;

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        transaction: {
          select: {
            id: true,
            listing: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

const createTicketSchema = z.object({
  subject: z.string().min(5).max(200),
  body: z.string().min(20).max(5000),
  category: z.enum([
    "GENERAL",
    "LISTING",
    "TRANSACTION",
    "PAYMENT",
    "VERIFICATION",
    "ACCOUNT",
    "TECHNICAL",
    "OTHER",
  ]).default("GENERAL"),
  transactionId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createTicketSchema.parse(body);

    // Verify transaction access if provided
    if (data.transactionId) {
      const transaction = await prisma.transaction.findUnique({
        where: { id: data.transactionId },
        select: { buyerId: true, sellerId: true },
      });

      if (!transaction) {
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
      }

      if (transaction.buyerId !== session.user.id && transaction.sellerId !== session.user.id) {
        return NextResponse.json({ error: "Cannot create ticket for this transaction" }, { status: 403 });
      }
    }

    // Check for rate limiting (max 5 tickets per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ticketCount = await prisma.supportTicket.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: today },
      },
    });

    if (ticketCount >= 5) {
      return NextResponse.json(
        { error: "Maximum 5 tickets per day. Please wait or contact us via phone." },
        { status: 429 }
      );
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id,
        transactionId: data.transactionId,
        subject: data.subject,
        body: data.body,
        status: "OPEN",
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "SUPPORT_TICKET" as any,
        entityId: ticket.id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "CREATE",
        diff: { subject: data.subject, category: data.category },
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating ticket:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}

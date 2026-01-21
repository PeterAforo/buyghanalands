import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        transaction: {
          select: {
            id: true,
            status: true,
            listing: { select: { id: true, title: true } },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Check authorization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });
    const isSupport = user?.roles.some((r) => ["ADMIN", "SUPPORT"].includes(r));

    if (ticket.userId !== session.user.id && !isSupport) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}

const updateTicketSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"]).optional(),
  body: z.string().min(1).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateTicketSchema.parse(body);

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });
    const isSupport = user?.roles.some((r) => ["ADMIN", "SUPPORT"].includes(r));

    // Users can only add to body, support can change status
    if (ticket.userId !== session.user.id && !isSupport) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {};

    if (data.status && isSupport) {
      updateData.status = data.status;
    }

    if (data.body) {
      // Append to existing body with timestamp
      const existingTicket = await prisma.supportTicket.findUnique({
        where: { id },
        select: { body: true },
      });

      const timestamp = new Date().toISOString();
      const sender = isSupport ? "[SUPPORT]" : "[USER]";
      updateData.body = `${existingTicket?.body}\n\n---\n${sender} ${timestamp}:\n${data.body}`;
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "SUPPORT_TICKET" as any,
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: data.status ? "STATUS_CHANGE" : "ADD_RESPONSE",
        diff: { status: data.status, hasNewMessage: !!data.body },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating ticket:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}

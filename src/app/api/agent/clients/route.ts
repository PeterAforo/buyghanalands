import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const addClientSchema = z.object({
  clientId: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agent = await prisma.agentProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent profile not found" }, { status: 404 });
    }

    const clients = await prisma.agentClient.findMany({
      where: { agentId: agent.id },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = addClientSchema.parse(body);

    const agent = await prisma.agentProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent profile not found" }, { status: 404 });
    }

    // Check if client exists
    const client = await prisma.user.findUnique({
      where: { id: data.clientId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check if already a client
    const existing = await prisma.agentClient.findFirst({
      where: {
        agentId: agent.id,
        clientId: data.clientId,
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Already a client" }, { status: 400 });
    }

    const agentClient = await prisma.agentClient.create({
      data: {
        agentId: agent.id,
        clientId: data.clientId,
        status: "PENDING",
      },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(agentClient, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error adding client:", error);
    return NextResponse.json({ error: "Failed to add client" }, { status: 500 });
  }
}

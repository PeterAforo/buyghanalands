import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createAgentProfileSchema = z.object({
  agencyName: z.string().min(2),
  licenseNumber: z.string().optional(),
  bio: z.string().min(20),
  serviceRegions: z.array(z.string()).min(1),
  commissionRate: z.number().min(0).max(20),
  specializations: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get agent profile
    const agent = await prisma.agentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        clients: {
          select: {
            id: true,
            fullName: true,
            email: true,
            createdAt: true,
          },
        },
        managedListings: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                status: true,
                priceGhs: true,
              },
            },
          },
        },
        _count: {
          select: {
            clients: true,
            managedListings: true,
            commissions: true,
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent profile not found" }, { status: 404 });
    }

    // Get commission stats
    const commissionStats = await prisma.agentCommission.aggregate({
      where: { agentId: agent.id },
      _sum: { amountGhs: true },
      _count: true,
    });

    return NextResponse.json({
      agent,
      stats: {
        totalCommissions: commissionStats._sum.amountGhs || 0,
        transactionsCount: commissionStats._count,
      },
    });
  } catch (error) {
    console.error("Error fetching agent profile:", error);
    return NextResponse.json({ error: "Failed to fetch agent profile" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createAgentProfileSchema.parse(body);

    // Check if already has agent profile
    const existing = await prisma.agentProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (existing) {
      return NextResponse.json({ error: "Agent profile already exists" }, { status: 400 });
    }

    const agent = await prisma.agentProfile.create({
      data: {
        userId: session.user.id,
        agencyName: data.agencyName,
        licenseNumber: data.licenseNumber,
        bio: data.bio,
        serviceRegions: data.serviceRegions,
        commissionRate: data.commissionRate,
        specializations: data.specializations || [],
        isVerified: false,
        isActive: true,
      },
    });

    // Add AGENT role to user
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        roles: { push: "AGENT" },
      },
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error creating agent profile:", error);
    return NextResponse.json({ error: "Failed to create agent profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const agent = await prisma.agentProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent profile not found" }, { status: 404 });
    }

    const updated = await prisma.agentProfile.update({
      where: { userId: session.user.id },
      data: {
        agencyName: body.agencyName,
        bio: body.bio,
        serviceRegions: body.serviceRegions,
        commissionRate: body.commissionRate,
        specializations: body.specializations,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating agent profile:", error);
    return NextResponse.json({ error: "Failed to update agent profile" }, { status: 500 });
  }
}

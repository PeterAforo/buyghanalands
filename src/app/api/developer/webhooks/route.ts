import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import crypto from "crypto";

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum([
    "listing.created",
    "listing.updated",
    "listing.published",
    "offer.received",
    "offer.accepted",
    "transaction.created",
    "transaction.funded",
    "transaction.completed",
    "message.received",
  ])),
  secret: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const webhooks = await prisma.webhook.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        lastTriggeredAt: true,
        failureCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(webhooks);
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
    });

    const features = subscription?.features as any;
    if (!features?.apiAccess) {
      return NextResponse.json({
        error: "Webhooks require Enterprise subscription",
        upgradeRequired: true,
      }, { status: 403 });
    }

    const body = await request.json();
    const data = createWebhookSchema.parse(body);

    // Generate secret if not provided
    const secret = data.secret || crypto.randomBytes(32).toString("hex");

    const webhook = await prisma.webhook.create({
      data: {
        userId: session.user.id,
        url: data.url,
        events: data.events,
        secret,
        isActive: true,
      },
    });

    return NextResponse.json({
      ...webhook,
      secret, // Only shown once
      warning: "Save the secret securely for verifying webhook signatures.",
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error creating webhook:", error);
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get("webhookId");

    if (!webhookId) {
      return NextResponse.json({ error: "Webhook ID required" }, { status: 400 });
    }

    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
      select: { userId: true },
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    if (webhook.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.webhook.delete({ where: { id: webhookId } });

    return NextResponse.json({ message: "Webhook deleted" });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return NextResponse.json({ error: "Failed to delete webhook" }, { status: 500 });
  }
}

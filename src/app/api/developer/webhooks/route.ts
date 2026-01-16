import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import crypto from "crypto";

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum([
    "LISTING_CREATED",
    "LISTING_PUBLISHED",
    "LISTING_SUSPENDED",
    "OFFER_CREATED",
    "OFFER_ACCEPTED",
    "TRANSACTION_CREATED",
    "TRANSACTION_STATUS_CHANGED",
    "PAYMENT_SUCCESS",
    "PAYMENT_FAILED",
  ])),
  secret: z.string().optional(),
});

async function getOrCreateApiClient(userId: string, userEmail: string | null) {
  let client = await prisma.apiClient.findFirst({
    where: { contactEmail: userEmail || `user-${userId}@buyghanalands.com` },
  });

  if (!client) {
    client = await prisma.apiClient.create({
      data: {
        name: `User ${userId}`,
        contactEmail: userEmail || `user-${userId}@buyghanalands.com`,
      },
    });
  }

  return client;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    const client = await getOrCreateApiClient(session.user.id, user?.email || null);

    const webhooks = await prisma.webhookEndpoint.findMany({
      where: { clientId: client.id },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    const client = await getOrCreateApiClient(session.user.id, user?.email || null);

    // Generate secret if not provided
    const secret = data.secret || crypto.randomBytes(32).toString("hex");

    const webhook = await prisma.webhookEndpoint.create({
      data: {
        clientId: client.id,
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    const client = await getOrCreateApiClient(session.user.id, user?.email || null);

    const webhook = await prisma.webhookEndpoint.findUnique({
      where: { id: webhookId },
      select: { clientId: true },
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    if (webhook.clientId !== client.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.webhookEndpoint.delete({ where: { id: webhookId } });

    return NextResponse.json({ message: "Webhook deleted" });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return NextResponse.json({ error: "Failed to delete webhook" }, { status: 500 });
  }
}

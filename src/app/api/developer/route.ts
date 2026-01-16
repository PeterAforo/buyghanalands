import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import crypto from "crypto";

const createApiKeySchema = z.object({
  name: z.string().min(2),
  scopes: z.array(z.enum(["LISTINGS_READ", "LISTINGS_WRITE", "TRANSACTIONS_READ", "TRANSACTIONS_WRITE", "PROFESSIONALS_READ", "WEBHOOKS_MANAGE"])).optional(),
});

async function getOrCreateApiClient(userId: string, userEmail: string | null) {
  // Find existing client by contact email matching user
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

    // Check subscription for API access
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
    });

    const features = subscription?.features as any;
    if (!features?.apiAccess) {
      return NextResponse.json({
        error: "API access requires Enterprise subscription",
        upgradeRequired: true,
      }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    const client = await getOrCreateApiClient(session.user.id, user?.email || null);

    // Get user's API keys via client
    const apiKeys = await prisma.apiKey.findMany({
      where: { clientId: client.id },
      select: {
        id: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        createdAt: true,
        status: true,
        rateLimit: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Get API usage stats
    const usageStats = await prisma.apiUsageLog.groupBy({
      by: ["path"],
      where: {
        key: { clientId: client.id },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      _count: true,
    });

    return NextResponse.json({
      apiKeys,
      usageStats,
      limits: {
        requestsPerMinute: 60,
        requestsPerDay: 10000,
      },
    });
  } catch (error) {
    console.error("Error fetching developer data:", error);
    return NextResponse.json({ error: "Failed to fetch developer data" }, { status: 500 });
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
        error: "API access requires Enterprise subscription",
        upgradeRequired: true,
      }, { status: 403 });
    }

    const body = await request.json();
    const data = createApiKeySchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    const client = await getOrCreateApiClient(session.user.id, user?.email || null);

    // Generate API key
    const rawKey = `bgl_${crypto.randomBytes(32).toString("hex")}`;
    const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.substring(0, 12);

    const apiKey = await prisma.apiKey.create({
      data: {
        clientId: client.id,
        keyHash: hashedKey,
        keyPrefix,
        scopes: data.scopes || ["LISTINGS_READ"],
        status: "ACTIVE",
      },
    });

    // Return the raw key only once
    return NextResponse.json({
      id: apiKey.id,
      key: rawKey, // Only shown once!
      keyPrefix,
      scopes: apiKey.scopes,
      warning: "Save this key securely. It will not be shown again.",
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error creating API key:", error);
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get("keyId");

    if (!keyId) {
      return NextResponse.json({ error: "Key ID required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    const client = await getOrCreateApiClient(session.user.id, user?.email || null);

    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
      select: { clientId: true },
    });

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    if (apiKey.clientId !== client.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.apiKey.delete({ where: { id: keyId } });

    return NextResponse.json({ message: "API key deleted" });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import crypto from "crypto";

const createApiKeySchema = z.object({
  name: z.string().min(2),
  permissions: z.array(z.enum(["READ_LISTINGS", "WRITE_LISTINGS", "READ_TRANSACTIONS", "WEBHOOKS"])),
});

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

    // Get user's API keys
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        lastUsedAt: true,
        createdAt: true,
        isActive: true,
        requestCount: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Get API usage stats
    const usageStats = await prisma.apiUsage.groupBy({
      by: ["endpoint"],
      where: {
        apiKey: { userId: session.user.id },
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

    // Generate API key
    const rawKey = `bgl_${crypto.randomBytes(32).toString("hex")}`;
    const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.substring(0, 12);

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: session.user.id,
        name: data.name,
        keyHash: hashedKey,
        keyPrefix,
        permissions: data.permissions,
        isActive: true,
      },
    });

    // Return the raw key only once
    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey, // Only shown once!
      keyPrefix,
      permissions: apiKey.permissions,
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

    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
      select: { userId: true },
    });

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    if (apiKey.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.apiKey.delete({ where: { id: keyId } });

    return NextResponse.json({ message: "API key deleted" });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 });
  }
}

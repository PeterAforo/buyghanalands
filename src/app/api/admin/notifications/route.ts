import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await withDbRetry(() => prisma.user.findUnique({ where: { id: userId }, select: { roles: true } }));
  return user?.roles.some((r) => ["ADMIN", "SUPPORT"].includes(r)) || false;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await isAdmin(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const notifications = await withDbRetry(() => prisma.pushNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { id: true, fullName: true } },
      },
    }));

    return NextResponse.json(serializeForJson(notifications));
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

const broadcastSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(500),
  actionUrl: z.string().url().optional().or(z.literal("")),
  targetType: z.enum(["ALL", "ROLE", "REGION", "KYC_STATUS"]),
  targetValue: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await isAdmin(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const data = broadcastSchema.parse(body);

    // Build target user query
    const userWhere: any = { accountStatus: "ACTIVE" };
    switch (data.targetType) {
      case "ROLE":
        userWhere.roles = { has: data.targetValue };
        break;
      case "REGION":
        userWhere.region = data.targetValue;
        break;
      case "KYC_STATUS":
        userWhere.kycTier = data.targetValue;
        break;
      case "ALL":
      default:
        // No filter — all active users
        break;
    }

    const targetUsers = await withDbRetry(() => prisma.user.findMany({
      where: userWhere,
      select: { id: true },
    }));

    if (targetUsers.length === 0) {
      return NextResponse.json({ error: "No users match the target criteria" }, { status: 400 });
    }

    // Create push notifications for each target user
    const notifications = await withDbRetry(() => prisma.pushNotification.createMany({
      data: targetUsers.map((u) => ({
        userId: u.id,
        type: "BROADCAST",
        title: data.title,
        body: data.body,
        data: data.actionUrl ? { actionUrl: data.actionUrl } : undefined,
      })),
    }));

    // Create audit log
    await withDbRetry(() => prisma.auditLog.create({
      data: {
        entityType: "PUSH_NOTIFICATION",
        entityId: "broadcast",
        actorType: "USER",
        actorUserId: session.user.id,
        action: "NOTIFICATION_BROADCAST",
        diff: {
          title: data.title,
          body: data.body,
          targetType: data.targetType,
          targetValue: data.targetValue,
          recipientCount: targetUsers.length,
        },
      },
    }));

    return NextResponse.json({
      message: `Notification sent to ${targetUsers.length} users`,
      recipientCount: targetUsers.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error broadcasting notification:", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}

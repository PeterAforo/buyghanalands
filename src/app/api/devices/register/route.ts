import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const registerSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["IOS", "ANDROID", "WEB"]),
  deviceName: z.string().optional(),
  appVersion: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = registerSchema.parse(body);

    // Upsert device token (update if exists, create if not)
    const deviceToken = await prisma.deviceToken.upsert({
      where: { token: data.token },
      update: {
        userId: session.user.id,
        platform: data.platform,
        deviceName: data.deviceName,
        appVersion: data.appVersion,
        isActive: true,
        lastUsedAt: new Date(),
      },
      create: {
        token: data.token,
        userId: session.user.id,
        platform: data.platform,
        deviceName: data.deviceName,
        appVersion: data.appVersion,
        isActive: true,
        lastUsedAt: new Date(),
      },
    });

    return NextResponse.json({
      id: deviceToken.id,
      success: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Device registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

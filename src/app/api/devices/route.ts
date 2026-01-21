import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const devices = await prisma.deviceToken.findMany({
      where: { userId: session.user.id },
      orderBy: { lastUsedAt: "desc" },
    });

    return NextResponse.json(devices);
  } catch (error) {
    console.error("Error fetching devices:", error);
    return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 });
  }
}

const registerDeviceSchema = z.object({
  token: z.string().min(10),
  platform: z.enum(["IOS", "ANDROID", "WEB"]),
  deviceName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = registerDeviceSchema.parse(body);

    // Check if token already exists
    const existing = await prisma.deviceToken.findUnique({
      where: { token: data.token },
    });

    if (existing) {
      // Update existing token
      const updated = await prisma.deviceToken.update({
        where: { token: data.token },
        data: {
          userId: session.user.id,
          lastUsedAt: new Date(),
          isActive: true,
        },
      });
      return NextResponse.json(updated);
    }

    // Create new device token
    const device = await prisma.deviceToken.create({
      data: {
        userId: session.user.id,
        token: data.token,
        platform: data.platform,
        deviceName: data.deviceName,
        isActive: true,
        lastUsedAt: new Date(),
      },
    });

    return NextResponse.json(device, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error registering device:", error);
    return NextResponse.json({ error: "Failed to register device" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "token is required" }, { status: 400 });
    }

    const device = await prisma.deviceToken.findUnique({
      where: { token },
      select: { userId: true },
    });

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    if (device.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.deviceToken.delete({ where: { token } });

    return NextResponse.json({ message: "Device removed" });
  } catch (error) {
    console.error("Error removing device:", error);
    return NextResponse.json({ error: "Failed to remove device" }, { status: 500 });
  }
}

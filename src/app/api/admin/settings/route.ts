import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.includes("ADMIN") || false;
}

// Default settings
const defaultSettings = {
  platformFeePercent: 2.5,
  escrowHoldDays: 7,
  maxListingImages: 10,
  maxDocumentSize: 10,
  enableEmailNotifications: true,
  enableSmsNotifications: true,
  requirePhoneVerification: true,
  requireEmailVerification: false,
  autoApproveVerifiedSellers: false,
  maintenanceMode: false,
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Try to get settings from database
    const settings = await prisma.systemSetting.findMany();
    
    if (settings.length === 0) {
      return NextResponse.json(defaultSettings);
    }

    // Convert array of settings to object
    const settingsObj = settings.reduce((acc, setting) => {
      try {
        acc[setting.key] = JSON.parse(setting.value);
      } catch {
        acc[setting.key] = setting.value;
      }
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({ ...defaultSettings, ...settingsObj });
  } catch (error) {
    console.error("Error fetching settings:", error);
    // Return defaults if there's an error (e.g., table doesn't exist)
    return NextResponse.json(defaultSettings);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Upsert each setting
    const updates = Object.entries(body).map(([key, value]) =>
      prisma.systemSetting.upsert({
        where: { key },
        update: { value: JSON.stringify(value) },
        create: { key, value: JSON.stringify(value) },
      })
    );

    await Promise.all(updates);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "SYSTEM_SETTING",
        entityId: "platform",
        actorType: "USER",
        actorUserId: session.user.id,
        action: "UPDATE",
        diff: body,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

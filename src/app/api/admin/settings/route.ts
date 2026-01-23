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

// Default settings - stored in memory for now
// In production, these would be stored in a database table
let platformSettings = {
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

    return NextResponse.json(platformSettings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(platformSettings);
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
    
    // Update settings in memory
    platformSettings = { ...platformSettings, ...body };

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "LISTING",
        entityId: "platform-settings",
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

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.some((role) => ["ADMIN", "SUPPORT", "MODERATOR", "COMPLIANCE"].includes(role)) || false;
}

const suspendSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  action: z.enum(["suspend", "activate", "deactivate"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = suspendSchema.parse(body);

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, accountStatus: true, roles: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent suspending other admins unless you're SUPER_ADMIN
    if (targetUser.roles.includes("ADMIN")) {
      const actorUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { roles: true },
      });
      if (!actorUser?.roles.includes("ADMIN")) {
        return NextResponse.json({ error: "Cannot modify admin accounts" }, { status: 403 });
      }
    }

    let newStatus: "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
    switch (data.action) {
      case "suspend":
        newStatus = "SUSPENDED";
        break;
      case "activate":
        newStatus = "ACTIVE";
        break;
      case "deactivate":
        newStatus = "DEACTIVATED";
        break;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { accountStatus: newStatus },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        accountStatus: true,
        roles: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "USER",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: `ACCOUNT_${data.action.toUpperCase()}`,
        diff: {
          previousStatus: targetUser.accountStatus,
          newStatus,
          reason: data.reason,
        },
      },
    });

    return NextResponse.json({
      message: `User account ${data.action}ed successfully`,
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating user status:", error);
    return NextResponse.json({ error: "Failed to update user status" }, { status: 500 });
  }
}

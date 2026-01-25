import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(10).optional(),
  password: z.string().min(6).optional(),
  roles: z.array(z.string()).optional(),
  accountStatus: z.enum(["ACTIVE", "SUSPENDED", "DEACTIVATED"]).optional(),
  kycTier: z.enum(["TIER_0_NONE", "TIER_1_ID_UPLOAD", "TIER_2_GHANA_CARD"]).optional(),
});

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.some((role) => ["ADMIN", "SUPPORT", "MODERATOR"].includes(role)) || false;
}

export async function PUT(
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
    const { action } = body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent self-modification
    if (id === session.user.id) {
      return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 });
    }

    type AccountStatusType = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
    let newStatus: AccountStatusType;

    switch (action) {
      case "suspend":
        newStatus = "SUSPENDED";
        break;
      case "activate":
        newStatus = "ACTIVE";
        break;
      case "deactivate":
        newStatus = "DEACTIVATED";
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { accountStatus: newStatus },
      select: {
        id: true,
        fullName: true,
        accountStatus: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "USER",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: `USER_${action.toUpperCase()}`,
        diff: { from: user.accountStatus, to: newStatus },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function GET(
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

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        listings: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, status: true, createdAt: true },
        },
        transactionsAsBuyer: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { listing: { select: { title: true } } },
        },
        transactionsAsSeller: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { listing: { select: { title: true } } },
        },
        _count: {
          select: {
            listings: true,
            transactionsAsBuyer: true,
            transactionsAsSeller: true,
            offers: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

// Update user details (PATCH for partial updates)
export async function PATCH(
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
    const validatedData = updateUserSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for unique constraints if updating phone or email
    if (validatedData.phone && validatedData.phone !== existingUser.phone) {
      const phoneExists = await prisma.user.findUnique({
        where: { phone: validatedData.phone },
      });
      if (phoneExists) {
        return NextResponse.json({ error: "Phone number already in use" }, { status: 400 });
      }
    }

    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });
      if (emailExists) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (validatedData.fullName) updateData.fullName = validatedData.fullName;
    if (validatedData.email !== undefined) updateData.email = validatedData.email;
    if (validatedData.phone) updateData.phone = validatedData.phone;
    if (validatedData.roles) updateData.roles = validatedData.roles;
    if (validatedData.accountStatus) updateData.accountStatus = validatedData.accountStatus;
    if (validatedData.kycTier) updateData.kycTier = validatedData.kycTier;
    if (validatedData.password) {
      updateData.passwordHash = await bcrypt.hash(validatedData.password, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        roles: true,
        accountStatus: true,
        kycTier: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "USER",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "USER_UPDATED_BY_ADMIN",
        diff: { before: existingUser, after: updatedUser, changes: validatedData },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// Delete user (soft delete)
export async function DELETE(
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

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Soft delete - deactivate the account
    await prisma.user.update({
      where: { id },
      data: { accountStatus: "DEACTIVATED" },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "USER",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "USER_DELETED_BY_ADMIN",
        diff: { deletedUser: user.fullName },
      },
    });

    return NextResponse.json({ success: true, message: "User deactivated successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

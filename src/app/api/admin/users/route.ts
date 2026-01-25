import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.some((role) => ["ADMIN", "SUPPORT", "MODERATOR"].includes(role)) || false;
}

const createUserSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email required").optional().nullable(),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  roles: z.array(z.string()).default(["BUYER"]),
  accountStatus: z.enum(["ACTIVE", "SUSPENDED", "DEACTIVATED"]).default("ACTIVE"),
});

const bulkActionSchema = z.object({
  action: z.enum(["suspend", "activate", "deactivate", "delete"]),
  userIds: z.array(z.string()).min(1, "At least one user ID required"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";
    const search = searchParams.get("search") || "";

    let where: any = {};

    switch (filter) {
      case "active":
        where.accountStatus = "ACTIVE";
        break;
      case "suspended":
        where.accountStatus = "SUSPENDED";
        break;
      case "sellers":
        where.roles = { has: "SELLER" };
        break;
      case "agents":
        where.roles = { has: "AGENT" };
        break;
      case "professionals":
        where.roles = { has: "PROFESSIONAL" };
        break;
      case "all":
        break;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        roles: true,
        kycTier: true,
        accountStatus: true,
        createdAt: true,
        _count: {
          select: {
            listings: true,
            transactionsAsBuyer: true,
            transactionsAsSeller: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Check if phone already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: validatedData.phone },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Phone number already registered" }, { status: 400 });
    }

    // Check if email already exists
    if (validatedData.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });
      if (existingEmail) {
        return NextResponse.json({ error: "Email already registered" }, { status: 400 });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    const newUser = await prisma.user.create({
      data: {
        fullName: validatedData.fullName,
        email: validatedData.email,
        phone: validatedData.phone,
        passwordHash: hashedPassword,
        roles: validatedData.roles as any,
        accountStatus: validatedData.accountStatus as any,
        phoneVerified: true, // Admin-created users are pre-verified
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        roles: true,
        accountStatus: true,
        createdAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "USER",
        entityId: newUser.id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "USER_CREATED_BY_ADMIN",
        diff: { created: newUser },
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

// Bulk actions
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
    const { action, userIds } = bulkActionSchema.parse(body);

    // Prevent self-modification
    if (userIds.includes(session.user.id)) {
      return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 });
    }

    let result;

    if (action === "delete") {
      // Soft delete or hard delete based on your preference
      result = await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { accountStatus: "DEACTIVATED" },
      });

      // Create audit logs
      for (const userId of userIds) {
        await prisma.auditLog.create({
          data: {
            entityType: "USER",
            entityId: userId,
            actorType: "USER",
            actorUserId: session.user.id,
            action: "USER_DELETED_BY_ADMIN",
            diff: { action: "deactivated" },
          },
        });
      }
    } else {
      const statusMap: Record<string, string> = {
        suspend: "SUSPENDED",
        activate: "ACTIVE",
        deactivate: "DEACTIVATED",
      };

      result = await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { accountStatus: statusMap[action] as any },
      });

      // Create audit logs
      for (const userId of userIds) {
        await prisma.auditLog.create({
          data: {
            entityType: "USER",
            entityId: userId,
            actorType: "USER",
            actorUserId: session.user.id,
            action: `USER_BULK_${action.toUpperCase()}`,
            diff: { newStatus: statusMap[action] },
          },
        });
      }
    }

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error performing bulk action:", error);
    return NextResponse.json({ error: "Failed to perform bulk action" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    let newStatus: string;

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

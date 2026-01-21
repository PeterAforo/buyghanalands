import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const deactivateSchema = z.object({
  password: z.string().min(1, "Password is required"),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = deactivateSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true, accountStatus: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify password
    const { compare } = await import("bcryptjs");
    const isValid = user.passwordHash ? await compare(data.password, user.passwordHash) : false;

    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 400 });
    }

    // Check for active transactions
    const activeTransactions = await prisma.transaction.count({
      where: {
        OR: [
          { buyerId: session.user.id },
          { sellerId: session.user.id },
        ],
        status: {
          notIn: ["CLOSED", "RELEASED", "REFUNDED"],
        },
      },
    });

    if (activeTransactions > 0) {
      return NextResponse.json(
        { error: "Cannot deactivate account with active transactions. Please complete or cancel all transactions first." },
        { status: 400 }
      );
    }

    // Deactivate account
    await prisma.user.update({
      where: { id: session.user.id },
      data: { accountStatus: "DEACTIVATED" },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "USER",
        entityId: session.user.id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "SELF_DEACTIVATE",
        diff: { reason: data.reason || "User requested deactivation" },
      },
    });

    return NextResponse.json({
      message: "Account deactivated successfully. You can reactivate by contacting support.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error deactivating account:", error);
    return NextResponse.json({ error: "Failed to deactivate account" }, { status: 500 });
  }
}

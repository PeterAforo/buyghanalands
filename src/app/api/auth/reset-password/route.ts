import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

const resetPasswordSchema = z.object({
  code: z.string().length(6),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = resetPasswordSchema.parse(body);

    // Find the OTP verification record
    const otpRecord = await prisma.oTPVerification.findFirst({
      where: {
        code: data.code,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord || !otpRecord.userId) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 400 }
      );
    }

    // Check attempts
    if (otpRecord.attempts >= 5) {
      return NextResponse.json(
        { error: "Too many attempts. Please request a new code." },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Update user password
    await prisma.user.update({
      where: { id: otpRecord.userId! },
      data: { passwordHash: hashedPassword },
    });

    // Delete the OTP record
    await prisma.oTPVerification.delete({
      where: { id: otpRecord.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "USER",
        entityId: otpRecord.userId!,
        actorType: "USER",
        actorUserId: otpRecord.userId!,
        action: "PASSWORD_RESET",
        diff: {},
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}

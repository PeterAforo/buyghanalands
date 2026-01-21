import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/email";

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = resendSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true, fullName: true },
    });

    if (!user) {
      // Don't reveal if email exists
      return NextResponse.json({
        message: "If an account exists with this email, a verification link has been sent.",
      });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        message: "Email is already verified. You can log in.",
      });
    }

    // Delete any existing tokens for this user
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate new token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        email,
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;
    await sendVerificationEmail(email, user.fullName, verificationUrl);

    return NextResponse.json({
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}

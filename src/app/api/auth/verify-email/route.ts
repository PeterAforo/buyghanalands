import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find the token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date() > verificationToken.expiresAt) {
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });
      return NextResponse.json(
        { error: "Verification token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Update user's email verification status
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    // Delete the used token
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    // Redirect to login with success message
    return NextResponse.redirect(
      new URL("/auth/login?verified=true", request.url)
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}

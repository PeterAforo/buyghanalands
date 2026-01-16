import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ error: "Phone and code required" }, { status: 400 });
    }

    // Find OTP record
    const otpRecord = await prisma.oTPVerification.findUnique({
      where: { phone },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: "No OTP found for this phone" }, { status: 404 });
    }

    // Check if expired
    if (new Date() > otpRecord.expiresAt) {
      await prisma.oTPVerification.delete({ where: { phone } });
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
    }

    // Check attempts
    if (otpRecord.attempts >= 3) {
      await prisma.oTPVerification.delete({ where: { phone } });
      return NextResponse.json({ error: "Too many attempts. Please request a new OTP" }, { status: 400 });
    }

    // Verify code
    if (otpRecord.code !== code) {
      await prisma.oTPVerification.update({
        where: { phone },
        data: { attempts: otpRecord.attempts + 1 },
      });
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // OTP verified - update user if linked
    if (otpRecord.userId) {
      await prisma.user.update({
        where: { id: otpRecord.userId },
        data: { phoneVerified: true },
      });
    }

    // Delete OTP record
    await prisma.oTPVerification.delete({ where: { phone } });

    return NextResponse.json({
      success: true,
      message: "Phone verified successfully",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}

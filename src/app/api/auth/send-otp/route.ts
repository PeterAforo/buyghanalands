import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendOTP } from "@/lib/sms";

export async function POST(request: NextRequest) {
  try {
    const { phone, userId } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }

    // Generate and send OTP
    const result = await sendOTP(phone);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    // Store OTP in database with expiry
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.oTPVerification.upsert({
      where: { phone },
      update: {
        code: result.otp!,
        expiresAt,
        attempts: 0,
      },
      create: {
        phone,
        code: result.otp!,
        expiresAt,
        userId: userId || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}

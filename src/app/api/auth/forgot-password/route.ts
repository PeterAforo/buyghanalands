import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendSMS, generateOTP } from "@/lib/sms";

const forgotPasswordSchema = z.object({
  phone: z.string().min(10).max(15),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = forgotPasswordSchema.parse(body);

    // Format phone number
    let phone = data.phone.replace(/\s+/g, "").replace(/^0/, "");
    if (!phone.startsWith("233")) {
      phone = `233${phone}`;
    }

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: data.phone },
          { phone: phone },
          { phone: `0${phone.slice(3)}` },
        ],
      },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ success: true });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    await prisma.oTPVerification.upsert({
      where: { phone: user.phone },
      update: {
        code: otp,
        expiresAt,
        attempts: 0,
        userId: user.id,
      },
      create: {
        phone: user.phone,
        code: otp,
        expiresAt,
        userId: user.id,
      },
    });

    // Send SMS
    const message = `Your BuyGhanaLands password reset code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
    await sendSMS(user.phone, message);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

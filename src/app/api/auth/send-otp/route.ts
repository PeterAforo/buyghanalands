import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendOTP } from "@/lib/sms";
import { checkRateLimit, getClientIP, createRateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const { phone, userId } = await request.json();

    // Rate limit by phone number (primary) and IP (secondary)
    const phoneRateLimit = checkRateLimit(phone || "unknown", RATE_LIMITS.OTP_SEND);
    if (!phoneRateLimit.success) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please try again later." },
        { 
          status: 429, 
          headers: createRateLimitHeaders(phoneRateLimit) 
        }
      );
    }

    const ip = getClientIP(request);
    const ipRateLimit = checkRateLimit(ip, { ...RATE_LIMITS.OTP_SEND, limit: 10, identifier: "otp-send-ip" });
    if (!ipRateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests from this IP. Please try again later." },
        { 
          status: 429, 
          headers: createRateLimitHeaders(ipRateLimit) 
        }
      );
    }

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

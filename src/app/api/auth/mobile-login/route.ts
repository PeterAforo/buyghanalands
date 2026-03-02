import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";
import { SignJWT } from "jose";
import { z } from "zod";
import crypto from "crypto";

const loginSchema = z.object({
  phone: z.string().min(1),
  password: z.string().min(1),
});

const otpLoginSchema = z.object({
  phone: z.string().min(1),
  otp: z.string().length(6),
});

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "fallback-secret-change-in-production"
);

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

async function generateAccessToken(user: {
  id: string;
  email: string | null;
  phone: string;
  roles: string[];
  kycTier: string;
  accountStatus: string;
  fullName: string;
}) {
  return await new SignJWT({
    sub: user.id,
    email: user.email,
    phone: user.phone,
    roles: user.roles,
    kycTier: user.kycTier,
    accountStatus: user.accountStatus,
    name: user.fullName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

function normalizePhone(phone: string): string {
  let normalized = phone.trim();
  if (normalized.startsWith("0") && normalized.length === 10) {
    normalized = "+233" + normalized.substring(1);
  }
  return normalized;
}

// Password-based login for mobile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Determine login type based on request body
    const isOtpLogin = "otp" in body;
    
    if (isOtpLogin) {
      // OTP-based login
      const { phone, otp } = otpLoginSchema.parse(body);
      const normalizedPhone = normalizePhone(phone);

      // Verify OTP
      const otpRecord = await prisma.oTPVerification.findUnique({
        where: { phone: normalizedPhone },
      });

      if (!otpRecord) {
        return NextResponse.json(
          { error: "No OTP found for this phone number" },
          { status: 400 }
        );
      }

      if (otpRecord.code !== otp) {
        // Increment attempts
        await prisma.oTPVerification.update({
          where: { id: otpRecord.id },
          data: { attempts: { increment: 1 } },
        });

        if (otpRecord.attempts >= 4) {
          await prisma.oTPVerification.delete({
            where: { id: otpRecord.id },
          });
          return NextResponse.json(
            { error: "Too many attempts. Please request a new OTP." },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: "Invalid OTP" },
          { status: 400 }
        );
      }

      if (new Date() > otpRecord.expiresAt) {
        await prisma.oTPVerification.delete({
          where: { id: otpRecord.id },
        });
        return NextResponse.json(
          { error: "OTP has expired" },
          { status: 400 }
        );
      }

      // OTP is valid - find or create user
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: normalizedPhone },
            { phone: phone.trim() },
          ],
        },
        select: {
          id: true,
          email: true,
          phone: true,
          roles: true,
          kycTier: true,
          accountStatus: true,
          fullName: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found. Please register first." },
          { status: 404 }
        );
      }

      // Delete used OTP
      await prisma.oTPVerification.delete({
        where: { id: otpRecord.id },
      });

      // Mark phone as verified
      await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
      });

      // Generate tokens
      const accessToken = await generateAccessToken(user);
      const refreshToken = generateRefreshToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt,
        },
      });

      return NextResponse.json({
        accessToken,
        refreshToken,
        expiresIn: 15 * 60,
        tokenType: "Bearer",
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          fullName: user.fullName,
          roles: user.roles,
          kycTier: user.kycTier,
        },
      });
    } else {
      // Password-based login
      const { phone, password } = loginSchema.parse(body);
      const normalizedPhone = normalizePhone(phone);

      // Find user
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: normalizedPhone },
            { phone: phone.trim() },
          ],
        },
        select: {
          id: true,
          email: true,
          phone: true,
          roles: true,
          kycTier: true,
          accountStatus: true,
          fullName: true,
          passwordHash: true,
        },
      });

      if (!user || !user.passwordHash) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }

      // Verify password
      const isValid = await compare(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }

      // Check account status
      if (user.accountStatus !== "ACTIVE") {
        return NextResponse.json(
          { error: "Account is not active" },
          { status: 403 }
        );
      }

      // Generate tokens
      const accessToken = await generateAccessToken(user);
      const refreshToken = generateRefreshToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt,
        },
      });

      return NextResponse.json({
        accessToken,
        refreshToken,
        expiresIn: 15 * 60,
        tokenType: "Bearer",
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          fullName: user.fullName,
          roles: user.roles,
          kycTier: user.kycTier,
        },
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Mobile login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

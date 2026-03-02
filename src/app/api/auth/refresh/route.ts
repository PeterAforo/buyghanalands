import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import crypto from "crypto";

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = refreshSchema.parse(body);

    // Find the refresh token in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            roles: true,
            kycTier: true,
            accountStatus: true,
            fullName: true,
          },
        },
      },
    });

    if (!storedToken) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    // Check if token is revoked
    if (storedToken.revokedAt) {
      return NextResponse.json(
        { error: "Refresh token has been revoked" },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      // Clean up expired token
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      return NextResponse.json(
        { error: "Refresh token has expired" },
        { status: 401 }
      );
    }

    // Check if user account is active
    if (storedToken.user.accountStatus !== "ACTIVE") {
      return NextResponse.json(
        { error: "Account is not active" },
        { status: 403 }
      );
    }

    // Generate new tokens (token rotation for security)
    const newAccessToken = await generateAccessToken(storedToken.user);
    const newRefreshToken = generateRefreshToken();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    // Revoke old token and create new one in a transaction
    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: storedToken.userId,
          expiresAt: newExpiresAt,
        },
      }),
    ]);

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      tokenType: "Bearer",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

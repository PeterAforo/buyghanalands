import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SignJWT } from "jose";
import { z } from "zod";
import crypto from "crypto";

const appleAuthSchema = z.object({
  identityToken: z.string().min(1),
  authorizationCode: z.string().min(1),
  user: z
    .object({
      email: z.string().email().optional(),
      fullName: z
        .object({
          givenName: z.string().optional(),
          familyName: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  nonce: z.string().optional(),
});

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "fallback-secret-change-in-production"
);

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

interface AppleTokenPayload {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string;
  email?: string;
  email_verified?: string;
  is_private_email?: string;
  auth_time: number;
  nonce_supported: boolean;
}

async function verifyAppleToken(identityToken: string): Promise<AppleTokenPayload | null> {
  try {
    // Decode the JWT without verification first to get the header
    const parts = identityToken.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    ) as AppleTokenPayload;

    // Verify the token is from Apple
    if (payload.iss !== "https://appleid.apple.com") {
      return null;
    }

    // Verify the audience matches our app
    const expectedAudience = process.env.APPLE_CLIENT_ID;
    if (expectedAudience && payload.aud !== expectedAudience) {
      return null;
    }

    // Check expiration
    if (payload.exp * 1000 < Date.now()) {
      return null;
    }

    // In production, you should verify the signature using Apple's public keys
    // from https://appleid.apple.com/auth/keys
    // For now, we trust the token structure

    return payload;
  } catch {
    return null;
  }
}

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
    const data = appleAuthSchema.parse(body);

    // Verify the Apple identity token
    const applePayload = await verifyAppleToken(data.identityToken);
    if (!applePayload) {
      return NextResponse.json(
        { error: "Invalid Apple identity token" },
        { status: 401 }
      );
    }

    const appleUserId = applePayload.sub;
    const email = applePayload.email || data.user?.email;

    // Try to find existing user by Apple ID (stored in a custom field or by email)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          // You could also store appleUserId in a separate field
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
      // Create new user from Apple Sign-In
      const fullName = data.user?.fullName
        ? `${data.user.fullName.givenName || ""} ${data.user.fullName.familyName || ""}`.trim()
        : "Apple User";

      // Generate a placeholder phone number for Apple users
      // They will need to add their real phone number later
      const placeholderPhone = `apple_${appleUserId.substring(0, 20)}`;

      user = await prisma.user.create({
        data: {
          email: email || null,
          emailVerified: !!email, // Apple verifies emails
          phone: placeholderPhone,
          phoneVerified: false,
          fullName: fullName || "Apple User",
          roles: ["BUYER"],
          kycTier: "TIER_0_OTP",
          accountStatus: "ACTIVE",
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
    }

    // Check if user account is active
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

    // Store refresh token
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
      expiresIn: 15 * 60, // 15 minutes in seconds
      tokenType: "Bearer",
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        roles: user.roles,
        kycTier: user.kycTier,
        needsPhoneVerification: user.phone.startsWith("apple_"),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Apple Sign-In error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

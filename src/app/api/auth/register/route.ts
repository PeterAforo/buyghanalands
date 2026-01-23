import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10),
  password: z.string().min(6),
  accountType: z.enum(["BUYER", "SELLER", "AGENT", "PROFESSIONAL"]),
});

// Map account type to user role
const ACCOUNT_TYPE_TO_ROLE: Record<string, string> = {
  BUYER: "BUYER",
  SELLER: "SELLER",
  AGENT: "AGENT",
  PROFESSIONAL: "PROFESSIONAL",
};

// Account types that get a free subscription on registration
const FREE_SUBSCRIPTION_TYPES = ["BUYER", "SELLER"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: data.phone },
          ...(data.email ? [{ email: data.email }] : []),
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this phone number or email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hash(data.password, 12);

    // Determine role from account type
    const role = ACCOUNT_TYPE_TO_ROLE[data.accountType] as any;

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        passwordHash,
        roles: [role],
        emailVerified: false,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        roles: true,
      },
    });

    // Create free subscription for Buyer/Seller
    if (FREE_SUBSCRIPTION_TYPES.includes(data.accountType)) {
      const now = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 100); // Effectively never expires for free tier

      const subscriptionData: any = {
        userId: user.id,
        category: data.accountType,
        billingCycle: "MONTHLY",
        priceGhs: 0,
        status: "ACTIVE",
        startDate: now,
        endDate: endDate,
        autoRenew: false,
      };

      // Set the appropriate plan field based on account type
      if (data.accountType === "BUYER") {
        subscriptionData.buyerPlan = "FREE";
        subscriptionData.features = {
          browseListings: true,
          basicAlerts: true,
          savedSearches: true,
          messaging: true,
          escrowProtection: true,
        };
      } else if (data.accountType === "SELLER") {
        subscriptionData.sellerPlan = "FREE";
        subscriptionData.listingLimit = 1;
        subscriptionData.transactionFeeRate = 0.05; // 5%
        subscriptionData.features = {
          createListings: true,
          basicVisibility: true,
          messaging: true,
          escrowProtection: true,
        };
      }

      await prisma.subscription.create({ data: subscriptionData });
    }

    // Generate email verification token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        email: data.email,
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;
    await sendVerificationEmail(data.email, data.fullName, verificationUrl);

    return NextResponse.json(
      { 
        message: "Account created! Please check your email to verify your account.",
        user,
        requiresVerification: true,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

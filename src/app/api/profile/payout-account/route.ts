import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";

// Valid mobile money issuer codes
const VALID_ISSUERS = ["MTN", "ATL", "VDF", "TGO", "ZPY", "GMY"];

const payoutAccountSchema = z
  .object({
    payoutAccountType: z.enum(["MOBILE_MONEY", "BANK"]),
    payoutAccountNumber: z
      .string()
      .min(1, "Account number is required")
      .max(50, "Account number is too long"),
    payoutAccountIssuer: z.string().optional(),
    payoutAccountBank: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.payoutAccountType === "MOBILE_MONEY") {
      if (!data.payoutAccountIssuer) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["payoutAccountIssuer"],
          message: "Account issuer is required for mobile money",
        });
      } else if (!VALID_ISSUERS.includes(data.payoutAccountIssuer)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["payoutAccountIssuer"],
          message: `Invalid issuer. Must be one of: ${VALID_ISSUERS.join(", ")}`,
        });
      }
    }
    if (data.payoutAccountType === "BANK") {
      if (!data.payoutAccountBank) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["payoutAccountBank"],
          message: "Bank is required for bank transfers",
        });
      }
    }
  });

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await withDbRetry(() =>
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          payoutAccountNumber: true,
          payoutAccountIssuer: true,
          payoutAccountBank: true,
          payoutAccountType: true,
        },
      })
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      payoutAccountNumber: user.payoutAccountNumber,
      payoutAccountIssuer: user.payoutAccountIssuer,
      payoutAccountBank: user.payoutAccountBank,
      payoutAccountType: user.payoutAccountType,
    });
  } catch (error) {
    console.error("Error fetching payout account:", error);
    return NextResponse.json({ error: "Failed to fetch payout account" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = payoutAccountSchema.parse(body);

    const updatedUser = await withDbRetry(() =>
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          payoutAccountType: data.payoutAccountType,
          payoutAccountNumber: data.payoutAccountNumber,
          payoutAccountIssuer: data.payoutAccountIssuer || null,
          payoutAccountBank: data.payoutAccountBank || null,
        },
        select: {
          payoutAccountNumber: true,
          payoutAccountIssuer: true,
          payoutAccountBank: true,
          payoutAccountType: true,
        },
      })
    );

    return NextResponse.json({
      message: "Payout account updated successfully",
      payoutAccountNumber: updatedUser.payoutAccountNumber,
      payoutAccountIssuer: updatedUser.payoutAccountIssuer,
      payoutAccountBank: updatedUser.payoutAccountBank,
      payoutAccountType: updatedUser.payoutAccountType,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating payout account:", error);
    return NextResponse.json({ error: "Failed to update payout account" }, { status: 500 });
  }
}

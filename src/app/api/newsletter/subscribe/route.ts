import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, withDbRetry } from "@/lib/db";

const subscribeSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if subscriber already exists
    const existing = await withDbRetry(() =>
      prisma.newsletterSubscriber.findUnique({
        where: { email: normalizedEmail },
      })
    );

    if (existing) {
      if (existing.isActive) {
        return NextResponse.json(
          { error: "You are already subscribed to our newsletter." },
          { status: 409 }
        );
      }

      // Reactivate a previously unsubscribed subscriber
      await withDbRetry(() =>
        prisma.newsletterSubscriber.update({
          where: { email: normalizedEmail },
          data: { isActive: true },
        })
      );

      return NextResponse.json(
        { message: "Welcome back! You have been resubscribed to our newsletter." },
        { status: 201 }
      );
    }

    // Create a new subscriber
    await withDbRetry(() =>
      prisma.newsletterSubscriber.create({
        data: { email: normalizedEmail },
      })
    );

    return NextResponse.json(
      { message: "Thank you for subscribing to our newsletter!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}

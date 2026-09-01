import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, withDbRetry } from "@/lib/db";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = contactSchema.parse(body);

    const contactMessage = await withDbRetry(() =>
      prisma.contactMessage.create({
        data: { name, email, subject, message },
      })
    );

    return NextResponse.json(
      { message: "Message sent successfully", id: contactMessage.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error saving contact message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

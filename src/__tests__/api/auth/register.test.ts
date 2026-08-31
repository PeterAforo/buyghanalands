import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/register/route";

jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    subscription: {
      create: jest.fn(),
    },
    emailVerificationToken: {
      create: jest.fn(),
    },
  },
  withDbRetry: jest.fn((fn: () => Promise<unknown>) => fn()),
}));

jest.mock("@/lib/email", () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password"),
}));

jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: jest.fn(),
  getClientIP: jest.fn().mockReturnValue("127.0.0.1"),
  createRateLimitHeaders: jest.fn().mockReturnValue({}),
  RATE_LIMITS: {
    REGISTER: { limit: 5, windowSeconds: 3600, identifier: "register" },
  },
}));

import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { hash } from "bcryptjs";
import { checkRateLimit } from "@/lib/rate-limit";

const mockPrisma = prisma as unknown as {
  user: { findFirst: jest.Mock; create: jest.Mock };
  subscription: { create: jest.Mock };
  emailVerificationToken: { create: jest.Mock };
};
const mockCheckRateLimit = checkRateLimit as jest.Mock;
const mockHash = hash as jest.Mock;
const mockSendVerificationEmail = sendVerificationEmail as jest.Mock;

const validBody = {
  fullName: "John Doe",
  email: "john@example.com",
  phone: "0240000000",
  password: "Password123",
  accountType: "BUYER",
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({
      success: true,
      limit: 5,
      remaining: 4,
      resetAt: Date.now() + 3600000,
    });
    mockHash.mockResolvedValue("hashed-password");
    mockSendVerificationEmail.mockResolvedValue({ success: true });
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: "user-1",
      fullName: "John Doe",
      email: "john@example.com",
      phone: "0240000000",
      roles: ["BUYER"],
    });
    mockPrisma.subscription.create.mockResolvedValue({});
    mockPrisma.emailVerificationToken.create.mockResolvedValue({});
  });

  it("should register a new user successfully", async () => {
    const res = await POST(makeRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.message).toContain("Account created");
    expect(json.user.email).toBe("john@example.com");
    expect(json.user.phone).toBe("0240000000");
    expect(json.requiresVerification).toBe(true);
    expect(mockHash).toHaveBeenCalledWith("Password123", 12);
    expect(mockPrisma.user.create).toHaveBeenCalled();
    expect(mockSendVerificationEmail).toHaveBeenCalledWith(
      "john@example.com",
      "John Doe",
      expect.stringContaining("verify-email")
    );
  });

  it("should return 400 for an invalid email", async () => {
    const res = await POST(makeRequest({ ...validBody, email: "not-an-email" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid input");
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it("should return 400 for a short password", async () => {
    const res = await POST(makeRequest({ ...validBody, password: "short" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid input");
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it("should return 400 when the phone number already exists", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: "existing-user" });

    const res = await POST(makeRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("already exists");
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it("should return 429 when rate limited", async () => {
    mockCheckRateLimit.mockReturnValue({
      success: false,
      limit: 5,
      remaining: 0,
      resetAt: Date.now() + 3600000,
      retryAfterSeconds: 3600,
    });

    const res = await POST(makeRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.error).toContain("Too many");
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });
});

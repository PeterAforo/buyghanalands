import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/verify-otp/route";

jest.mock("@/lib/db", () => ({
  prisma: {
    oTPVerification: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  },
  withDbRetry: jest.fn((fn: () => Promise<unknown>) => fn()),
}));

jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: jest.fn().mockReturnValue({
    success: true,
    limit: 5,
    remaining: 4,
    resetAt: Date.now() + 600000,
  }),
  getClientIP: jest.fn().mockReturnValue("127.0.0.1"),
  createRateLimitHeaders: jest.fn().mockReturnValue({}),
  RATE_LIMITS: {
    OTP_VERIFY: { limit: 5, windowSeconds: 600, identifier: "otp-verify" },
  },
}));

import { prisma } from "@/lib/db";

const mockPrisma = prisma as unknown as {
  oTPVerification: {
    findUnique: jest.Mock;
    delete: jest.Mock;
    update: jest.Mock;
  };
  user: { update: jest.Mock };
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const phone = "0240000000";
const validCode = "123456";

describe("POST /api/auth/verify-otp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.oTPVerification.findUnique.mockResolvedValue(null);
    mockPrisma.oTPVerification.delete.mockResolvedValue({});
    mockPrisma.oTPVerification.update.mockResolvedValue({});
    mockPrisma.user.update.mockResolvedValue({});
  });

  it("should verify OTP successfully", async () => {
    mockPrisma.oTPVerification.findUnique.mockResolvedValue({
      phone,
      code: validCode,
      attempts: 0,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      userId: "user-1",
    });

    const res = await POST(makeRequest({ phone, code: validCode }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toContain("verified");
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { phoneVerified: true },
    });
    expect(mockPrisma.oTPVerification.delete).toHaveBeenCalledWith({ where: { phone } });
  });

  it("should return 400 for an invalid OTP", async () => {
    mockPrisma.oTPVerification.findUnique.mockResolvedValue({
      phone,
      code: validCode,
      attempts: 0,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      userId: "user-1",
    });

    const res = await POST(makeRequest({ phone, code: "000000" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid OTP");
    expect(mockPrisma.oTPVerification.update).toHaveBeenCalledWith({
      where: { phone },
      data: { attempts: 1 },
    });
  });

  it("should return 400 for an expired OTP", async () => {
    mockPrisma.oTPVerification.findUnique.mockResolvedValue({
      phone,
      code: validCode,
      attempts: 0,
      expiresAt: new Date(Date.now() - 60 * 1000),
      userId: "user-1",
    });

    const res = await POST(makeRequest({ phone, code: validCode }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("expired");
    expect(mockPrisma.oTPVerification.delete).toHaveBeenCalledWith({ where: { phone } });
  });

  it("should return 400 when too many attempts have been made", async () => {
    mockPrisma.oTPVerification.findUnique.mockResolvedValue({
      phone,
      code: validCode,
      attempts: 3,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      userId: "user-1",
    });

    const res = await POST(makeRequest({ phone, code: validCode }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Too many attempts");
    expect(mockPrisma.oTPVerification.delete).toHaveBeenCalledWith({ where: { phone } });
  });

  it("should return 400 when phone or code is missing", async () => {
    const res = await POST(makeRequest({ phone }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Phone and code required");
    expect(mockPrisma.oTPVerification.findUnique).not.toHaveBeenCalled();
  });
});

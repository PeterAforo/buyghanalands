import { NextRequest } from "next/server";
import { POST } from "@/app/api/kyc/route";

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    kycRequest: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
  withDbRetry: jest.fn((fn: () => Promise<unknown>) => fn()),
}));

jest.mock("@/lib/kyc", () => ({
  performAutomatedChecks: jest.fn(),
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { performAutomatedChecks } from "@/lib/kyc";

const mockAuth = auth as jest.Mock;
const mockPrisma = prisma as unknown as {
  kycRequest: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
  auditLog: { create: jest.Mock };
};
const mockPerformAutomatedChecks = performAutomatedChecks as jest.Mock;

const validBody = {
  ghanaCardNumber: "GHA-123456789-1",
  reason: "SELLER_VERIFICATION" as const,
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/kyc", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/kyc", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockPrisma.kycRequest.findFirst.mockResolvedValue(null);
    mockPrisma.kycRequest.create.mockResolvedValue({ id: "kyc-1" });
    mockPrisma.kycRequest.update.mockResolvedValue({ id: "kyc-1", status: "PENDING" });
    mockPrisma.auditLog.create.mockResolvedValue({});
  });

  it("should initiate KYC when automated checks pass (201, PENDING)", async () => {
    mockPerformAutomatedChecks.mockReturnValue({
      overallPassed: true,
      confidenceScore: 90,
      results: [
        { checkName: "cardFormat", passed: true, confidence: 100, notes: "ok" },
      ],
      recommendedTier: "TIER_2_GHANA_CARD",
      timestamp: new Date(),
    });
    mockPrisma.kycRequest.update.mockResolvedValue({ id: "kyc-1", status: "PENDING" });

    const res = await POST(makeRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.message).toContain("KYC verification initiated");
    expect(json.request.status).toBe("PENDING");
    expect(mockPrisma.kycRequest.create).toHaveBeenCalled();
    expect(mockPrisma.auditLog.create).toHaveBeenCalled();
  });

  it("should mark KYC as FAILED when automated checks fail (201, FAILED)", async () => {
    mockPerformAutomatedChecks.mockReturnValue({
      overallPassed: false,
      confidenceScore: 30,
      results: [
        { checkName: "cardFormat", passed: false, confidence: 0, notes: "Invalid format" },
      ],
      recommendedTier: "TIER_0_OTP",
      timestamp: new Date(),
    });
    mockPrisma.kycRequest.update.mockResolvedValue({ id: "kyc-1", status: "FAILED" });

    const res = await POST(makeRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.request.status).toBe("FAILED");
    expect(mockPrisma.kycRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "FAILED" }),
      })
    );
  });

  it("should return 401 when unauthorized", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
    expect(mockPrisma.kycRequest.create).not.toHaveBeenCalled();
  });

  it("should return 400 when required fields are missing", async () => {
    const res = await POST(makeRequest({ reason: "MANUAL_REQUEST" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid input");
    expect(mockPrisma.kycRequest.create).not.toHaveBeenCalled();
  });

  it("should return 400 when a KYC request is already in progress", async () => {
    mockPrisma.kycRequest.findFirst.mockResolvedValue({ id: "existing-kyc", status: "PENDING" });

    const res = await POST(makeRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("already in progress");
    expect(mockPrisma.kycRequest.create).not.toHaveBeenCalled();
  });
});

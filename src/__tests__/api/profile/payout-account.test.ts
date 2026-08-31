import { NextRequest } from "next/server";
import { GET, PUT } from "@/app/api/profile/payout-account/route";

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
  withDbRetry: jest.fn((fn: () => Promise<unknown>) => fn()),
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const mockAuth = auth as jest.Mock;
const mockPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock; update: jest.Mock };
};

function makePutRequest(body: unknown) {
  return new NextRequest("http://localhost/api/profile/payout-account", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("/api/profile/payout-account", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockPrisma.user.findUnique.mockResolvedValue({
      payoutAccountNumber: "0240000000",
      payoutAccountIssuer: "MTN",
      payoutAccountBank: null,
      payoutAccountType: "MOBILE_MONEY",
    });
    mockPrisma.user.update.mockResolvedValue({});
  });

  describe("GET", () => {
    it("should return the current payout account", async () => {
      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.payoutAccountType).toBe("MOBILE_MONEY");
      expect(json.payoutAccountNumber).toBe("0240000000");
      expect(json.payoutAccountIssuer).toBe("MTN");
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
        select: expect.objectContaining({ payoutAccountNumber: true }),
      });
    });

    it("should return 401 when unauthorized", async () => {
      mockAuth.mockResolvedValue(null);

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
    });
  });

  describe("PUT", () => {
    it("should update a mobile money account", async () => {
      mockPrisma.user.update.mockResolvedValue({
        payoutAccountNumber: "0240000000",
        payoutAccountIssuer: "MTN",
        payoutAccountBank: null,
        payoutAccountType: "MOBILE_MONEY",
      });

      const res = await PUT(
        makePutRequest({
          payoutAccountType: "MOBILE_MONEY",
          payoutAccountNumber: "0240000000",
          payoutAccountIssuer: "MTN",
        })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.message).toContain("updated");
      expect(json.payoutAccountType).toBe("MOBILE_MONEY");
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
          data: expect.objectContaining({
            payoutAccountType: "MOBILE_MONEY",
            payoutAccountNumber: "0240000000",
            payoutAccountIssuer: "MTN",
          }),
        })
      );
    });

    it("should update a bank account", async () => {
      mockPrisma.user.update.mockResolvedValue({
        payoutAccountNumber: "1234567890",
        payoutAccountIssuer: null,
        payoutAccountBank: "Ecobank",
        payoutAccountType: "BANK",
      });

      const res = await PUT(
        makePutRequest({
          payoutAccountType: "BANK",
          payoutAccountNumber: "1234567890",
          payoutAccountBank: "Ecobank",
        })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.message).toContain("updated");
      expect(json.payoutAccountType).toBe("BANK");
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            payoutAccountType: "BANK",
            payoutAccountBank: "Ecobank",
          }),
        })
      );
    });

    it("should reject an invalid mobile money issuer (400)", async () => {
      const res = await PUT(
        makePutRequest({
          payoutAccountType: "MOBILE_MONEY",
          payoutAccountNumber: "0240000000",
          payoutAccountIssuer: "INVALID",
        })
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe("Invalid input");
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("should reject a missing account number (400)", async () => {
      const res = await PUT(
        makePutRequest({
          payoutAccountType: "MOBILE_MONEY",
          payoutAccountNumber: "",
          payoutAccountIssuer: "MTN",
        })
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe("Invalid input");
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("should return 401 when unauthorized", async () => {
      mockAuth.mockResolvedValue(null);

      const res = await PUT(
        makePutRequest({
          payoutAccountType: "MOBILE_MONEY",
          payoutAccountNumber: "0240000000",
          payoutAccountIssuer: "MTN",
        })
      );
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });
});

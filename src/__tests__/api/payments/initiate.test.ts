import { NextRequest } from "next/server";
import { POST } from "@/app/api/payments/initiate/route";

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    listing: {
      findUnique: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
  withDbRetry: jest.fn((fn: () => Promise<unknown>) => fn()),
}));

jest.mock("@/lib/theteller", () => ({
  initiateCheckout: jest.fn(),
  generateTransactionId: jest.fn().mockReturnValue("000000000001"),
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { initiateCheckout } from "@/lib/theteller";

const mockAuth = auth as jest.Mock;
const mockPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock };
  listing: { findUnique: jest.Mock };
  payment: { create: jest.Mock; update: jest.Mock };
};
const mockInitiateCheckout = initiateCheckout as jest.Mock;

const validBody = {
  listingId: "listing-1",
  amount: 1000,
  type: "ESCROW_DEPOSIT" as const,
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/payments/initiate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/payments/initiate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "buyer@example.com",
      phone: "0240000000",
      fullName: "Buyer",
    });
    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing-1",
      title: "Acre in Kumasi",
      priceGhs: 1000,
      sellerId: "seller-1",
      status: "PUBLISHED",
    });
    mockPrisma.payment.create.mockResolvedValue({ id: "payment-1" });
    mockPrisma.payment.update.mockResolvedValue({});
    mockInitiateCheckout.mockResolvedValue({
      status: "success",
      code: 0,
      reason: "Success",
      token: "tok",
      checkout_url: "https://checkout.theteller.net/abc",
    });
  });

  it("should initiate payment and return a checkout URL", async () => {
    const res = await POST(makeRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.paymentId).toBe("payment-1");
    expect(json.txRef).toBe("000000000001");
    expect(json.paymentUrl).toBe("https://checkout.theteller.net/abc");
    expect(mockInitiateCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ amountGhs: 1000, email: "buyer@example.com" })
    );
  });

  it("should return 401 when unauthorized", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
    expect(mockPrisma.payment.create).not.toHaveBeenCalled();
  });

  it("should return 400 for an invalid (non-positive) amount", async () => {
    const res = await POST(makeRequest({ ...validBody, amount: -50 }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid request data");
    expect(mockPrisma.payment.create).not.toHaveBeenCalled();
  });

  it("should return 500 when the Theteller API throws", async () => {
    mockInitiateCheckout.mockRejectedValue(new Error("Theteller down"));

    const res = await POST(makeRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Internal server error");
  });

  it("should return 400 when the listing is not published", async () => {
    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing-1",
      title: "Acre in Kumasi",
      priceGhs: 1000,
      sellerId: "seller-1",
      status: "DRAFT",
    });

    const res = await POST(makeRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("not available");
  });
});

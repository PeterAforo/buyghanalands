import { NextRequest } from "next/server";
import { POST } from "@/app/api/newsletter/subscribe/route";

jest.mock("@/lib/db", () => ({
  prisma: {
    newsletterSubscriber: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
  withDbRetry: jest.fn((fn: () => Promise<unknown>) => fn()),
}));

import { prisma } from "@/lib/db";

const mockPrisma = prisma as unknown as {
  newsletterSubscriber: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/newsletter/subscribe", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/newsletter/subscribe", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(null);
    mockPrisma.newsletterSubscriber.create.mockResolvedValue({});
    mockPrisma.newsletterSubscriber.update.mockResolvedValue({});
  });

  it("should subscribe a new email successfully (201)", async () => {
    const res = await POST(makeRequest({ email: "user@example.com" }));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.message).toContain("Thank you");
    expect(mockPrisma.newsletterSubscriber.create).toHaveBeenCalledWith({
      data: { email: "user@example.com" },
    });
  });

  it("should normalize the email to lowercase before saving", async () => {
    await POST(makeRequest({ email: "USER@Example.COM" }));

    expect(mockPrisma.newsletterSubscriber.findUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
    });
  });

  it("should return 400 for an invalid email", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("valid email");
    expect(mockPrisma.newsletterSubscriber.create).not.toHaveBeenCalled();
  });

  it("should return 409 when already subscribed", async () => {
    mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue({
      email: "user@example.com",
      isActive: true,
    });

    const res = await POST(makeRequest({ email: "user@example.com" }));
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toContain("already subscribed");
    expect(mockPrisma.newsletterSubscriber.update).not.toHaveBeenCalled();
    expect(mockPrisma.newsletterSubscriber.create).not.toHaveBeenCalled();
  });

  it("should reactivate an inactive (unsubscribed) subscriber (201)", async () => {
    mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue({
      email: "user@example.com",
      isActive: false,
    });

    const res = await POST(makeRequest({ email: "user@example.com" }));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.message).toContain("Welcome back");
    expect(mockPrisma.newsletterSubscriber.update).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      data: { isActive: true },
    });
    expect(mockPrisma.newsletterSubscriber.create).not.toHaveBeenCalled();
  });
});

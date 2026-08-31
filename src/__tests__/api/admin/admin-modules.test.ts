import { GET as ProfessionalsGet } from "@/app/api/admin/professionals/route";
import { GET as ProfessionalDetailGet, PUT as ProfessionalDetailPut } from "@/app/api/admin/professionals/[id]/route";
import { GET as BookingsGet } from "@/app/api/admin/bookings/route";
import { GET as WorkflowsGet } from "@/app/api/admin/workflows/route";
import { GET as WorkflowDetailGet } from "@/app/api/admin/workflows/[id]/route";
import { GET as SubscriptionsGet } from "@/app/api/admin/subscriptions/route";
import { GET as PaymentsGet } from "@/app/api/admin/payments/route";
import { GET as OffersGet } from "@/app/api/admin/offers/route";
import { GET as ClaimsGet, PUT as ClaimsPut } from "@/app/api/admin/insurance/claims/[id]/route";
import { GET as ClaimsListGet } from "@/app/api/admin/insurance/claims/route";
import { GET as DocumentsGet } from "@/app/api/admin/documents/route";
import { GET as NotificationsGet, POST as NotificationsPost } from "@/app/api/admin/notifications/route";
import { GET as CmsGet, POST as CmsPost, DELETE as CmsDelete } from "@/app/api/admin/cms/route";

jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    professionalProfile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    booking: { findMany: jest.fn() },
    propertyWorkflow: { findMany: jest.fn(), findUnique: jest.fn() },
    subscription: { findMany: jest.fn(), count: jest.fn(), groupBy: jest.fn() },
    payment: { findMany: jest.fn(), count: jest.fn(), groupBy: jest.fn() },
    offer: { findMany: jest.fn() },
    insuranceClaim: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    document: { findMany: jest.fn() },
    pushNotification: { findMany: jest.fn(), createMany: jest.fn() },
    newsArticle: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    faqItem: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    supportCategory: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    homepageStat: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    siteSetting: { findMany: jest.fn(), upsert: jest.fn(), delete: jest.fn() },
    auditLog: { create: jest.fn() },
  },
  withDbRetry: jest.fn((fn: () => Promise<unknown>) => fn()),
}));

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const mockAuth = auth as jest.Mock;
const mockPrisma = prisma as any;

function mockRequest(url: string, body?: any) {
  return {
    url,
    json: () => Promise.resolve(body || {}),
    nextUrl: new URL(url),
  } as any;
}

function mockParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("Admin API routes — auth & role gating", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Professionals GET returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await ProfessionalsGet(mockRequest("http://localhost/api/admin/professionals"));
    expect(res.status).toBe(401);
  });

  it("Professionals GET returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["BUYER"] });
    const res = await ProfessionalsGet(mockRequest("http://localhost/api/admin/professionals"));
    expect(res.status).toBe(403);
  });

  it("Professionals GET returns 200 for admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["ADMIN"] });
    mockPrisma.professionalProfile.findMany.mockResolvedValue([]);
    mockPrisma.professionalProfile.count.mockResolvedValue(0);
    mockPrisma.professionalProfile.groupBy.mockResolvedValue([]);
    const res = await ProfessionalsGet(mockRequest("http://localhost/api/admin/professionals"));
    expect(res.status).toBe(200);
  });

  it("Bookings GET returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await BookingsGet(mockRequest("http://localhost/api/admin/bookings"));
    expect(res.status).toBe(401);
  });

  it("Workflows GET returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["BUYER"] });
    const res = await WorkflowsGet(mockRequest("http://localhost/api/admin/workflows"));
    expect(res.status).toBe(403);
  });

  it("Subscriptions GET returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["SELLER"] });
    const res = await SubscriptionsGet(mockRequest("http://localhost/api/admin/subscriptions"));
    expect(res.status).toBe(403);
  });

  it("Payments GET returns 403 for non-finance user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["BUYER"] });
    const res = await PaymentsGet(mockRequest("http://localhost/api/admin/payments"));
    expect(res.status).toBe(403);
  });

  it("Offers GET returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await OffersGet(mockRequest("http://localhost/api/admin/offers"));
    expect(res.status).toBe(401);
  });

  it("Insurance Claims GET returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["BUYER"] });
    const res = await ClaimsListGet(mockRequest("http://localhost/api/admin/insurance/claims"));
    expect(res.status).toBe(403);
  });

  it("Documents GET returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await DocumentsGet(mockRequest("http://localhost/api/admin/documents"));
    expect(res.status).toBe(401);
  });

  it("Notifications GET returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["BUYER"] });
    const res = await NotificationsGet(mockRequest("http://localhost/api/admin/notifications"));
    expect(res.status).toBe(403);
  });

  it("CMS GET returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await CmsGet(mockRequest("http://localhost/api/admin/cms"));
    expect(res.status).toBe(401);
  });
});

describe("Admin Notifications POST — broadcast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["ADMIN"] });
  });

  it("returns 400 when no users match target criteria", async () => {
    mockPrisma.user.findMany.mockResolvedValue([]);
    const res = await NotificationsPost(
      mockRequest("http://localhost/api/admin/notifications", {
        title: "Test",
        body: "Test body",
        targetType: "ALL",
      })
    );
    expect(res.status).toBe(400);
  });

  it("creates notifications for matching users", async () => {
    mockPrisma.user.findMany.mockResolvedValue([{ id: "u1" }, { id: "u2" }]);
    mockPrisma.pushNotification.createMany.mockResolvedValue({ count: 2 });
    const res = await NotificationsPost(
      mockRequest("http://localhost/api/admin/notifications", {
        title: "Test",
        body: "Test body",
        targetType: "ALL",
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.recipientCount).toBe(2);
  });
});

describe("Admin CMS POST — create/update", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["ADMIN"] });
  });

  it("creates a news article", async () => {
    mockPrisma.newsArticle.create.mockResolvedValue({ id: "n1", title: "Test" });
    const res = await CmsPost(
      mockRequest("http://localhost/api/admin/cms", {
        entityType: "news",
        data: { title: "Test", slug: "test", content: "Content" },
      })
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.newsArticle.create).toHaveBeenCalled();
  });

  it("upserts site setting", async () => {
    mockPrisma.siteSetting.upsert.mockResolvedValue({ key: "brand.name", value: "Test" });
    const res = await CmsPost(
      mockRequest("http://localhost/api/admin/cms", {
        entityType: "siteSetting",
        data: { key: "brand.name", value: "Test", type: "text" },
      })
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.siteSetting.upsert).toHaveBeenCalled();
  });

  it("upserts page content as JSON", async () => {
    mockPrisma.siteSetting.upsert.mockResolvedValue({ key: "page.homepage.content", value: "{}" });
    const res = await CmsPost(
      mockRequest("http://localhost/api/admin/cms", {
        entityType: "pageContent",
        data: { pageKey: "homepage", sectionKey: "content", content: { hero: "test" } },
      })
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.siteSetting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: "page.homepage.content" },
      })
    );
  });
});

describe("Admin Insurance Claims PUT — review", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["ADMIN"] });
  });

  it("returns 404 when claim not found", async () => {
    mockPrisma.insuranceClaim.findUnique.mockResolvedValue(null);
    const res = await ClaimsPut(
      mockRequest("http://localhost/api/admin/insurance/claims/xyz", {
        status: "APPROVED",
        reviewNote: "ok",
      }),
      mockParams("xyz")
    );
    expect(res.status).toBe(404);
  });

  it("approves a claim", async () => {
    mockPrisma.insuranceClaim.findUnique.mockResolvedValue({ id: "c1", status: "SUBMITTED" });
    mockPrisma.insuranceClaim.update.mockResolvedValue({ id: "c1", status: "APPROVED" });
    const res = await ClaimsPut(
      mockRequest("http://localhost/api/admin/insurance/claims/c1", {
        status: "APPROVED",
        reviewNote: "Approved",
        approvedAmount: 5000,
      }),
      mockParams("c1")
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.insuranceClaim.update).toHaveBeenCalled();
    expect(mockPrisma.auditLog.create).toHaveBeenCalled();
  });
});

describe("Admin Professionals PUT — update", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["ADMIN"] });
  });

  it("verifies a professional license", async () => {
    mockPrisma.professionalProfile.update.mockResolvedValue({ id: "p1", licenseStatus: "VERIFIED" });
    const res = await ProfessionalDetailPut(
      mockRequest("http://localhost/api/admin/professionals/p1", {
        licenseStatus: "VERIFIED",
      }),
      mockParams("p1")
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.professionalProfile.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { licenseStatus: "VERIFIED" },
    });
  });
});

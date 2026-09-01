import { GET as ProfessionalsGet } from "@/app/api/admin/professionals/route";
import { GET as ProfessionalDetailGet, PUT as ProfessionalDetailPut } from "@/app/api/admin/professionals/[id]/route";
import { GET as BookingsGet, PUT as BookingsPut } from "@/app/api/admin/bookings/route";
import { GET as WorkflowsGet } from "@/app/api/admin/workflows/route";
import { GET as WorkflowDetailGet, PUT as WorkflowDetailPut } from "@/app/api/admin/workflows/[id]/route";
import { GET as SubscriptionsGet, PUT as SubscriptionsPut } from "@/app/api/admin/subscriptions/route";
import { GET as PaymentsGet, PUT as PaymentsPut } from "@/app/api/admin/payments/route";
import { GET as OffersGet, PUT as OffersPut } from "@/app/api/admin/offers/route";
import { GET as ClaimsGet, PUT as ClaimsPut } from "@/app/api/admin/insurance/claims/[id]/route";
import { GET as ClaimsListGet } from "@/app/api/admin/insurance/claims/route";
import { GET as DocumentsGet, PUT as DocumentsPut, DELETE as DocumentsDelete } from "@/app/api/admin/documents/route";
import { GET as NotificationsGet, POST as NotificationsPost } from "@/app/api/admin/notifications/route";
import { GET as CmsGet, POST as CmsPost, DELETE as CmsDelete } from "@/app/api/admin/cms/route";
import { POST as ContactPost } from "@/app/api/contact/route";
import { GET as TransactionsListGet } from "@/app/api/admin/transactions/route";
import { GET as TransactionDetailGet, PUT as TransactionDetailPut } from "@/app/api/admin/transactions/[id]/route";
import { PUT as MilestoneApprovePut } from "@/app/api/admin/transactions/[id]/milestones/[milestoneId]/route";

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
    booking: { findMany: jest.fn(), update: jest.fn() },
    propertyWorkflow: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    workflowNote: { create: jest.fn() },
    subscription: { findMany: jest.fn(), count: jest.fn(), groupBy: jest.fn(), update: jest.fn() },
    payment: { findMany: jest.fn(), count: jest.fn(), groupBy: jest.fn(), update: jest.fn() },
    offer: { findMany: jest.fn(), update: jest.fn() },
    insuranceClaim: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    document: { findMany: jest.fn(), update: jest.fn(), delete: jest.fn() },
    pushNotification: { findMany: jest.fn(), createMany: jest.fn() },
    newsArticle: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    faqItem: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    supportCategory: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    homepageStat: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    siteSetting: { findMany: jest.fn(), findUnique: jest.fn(), upsert: jest.fn(), delete: jest.fn() },
    testimonial: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    homepageStep: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    homepageLandType: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    homepageProfessional: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    homepageRegion: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    trustBarItem: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    heroContent: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    contactMessage: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    transaction: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    escrowMilestone: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
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

describe("Admin Bookings PUT — status update", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["ADMIN"] });
  });

  it("updates booking status", async () => {
    mockPrisma.booking.update.mockResolvedValue({ id: "b1", status: "COMPLETED" });
    const res = await BookingsPut(
      mockRequest("http://localhost/api/admin/bookings", { id: "b1", status: "COMPLETED" })
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.booking.update).toHaveBeenCalled();
  });

  it("rejects invalid status", async () => {
    const res = await BookingsPut(
      mockRequest("http://localhost/api/admin/bookings", { id: "b1", status: "INVALID" })
    );
    expect(res.status).toBe(400);
  });
});

describe("Admin Subscriptions PUT — status update", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["ADMIN"] });
  });

  it("cancels a subscription", async () => {
    mockPrisma.subscription.update.mockResolvedValue({ id: "s1", status: "CANCELLED" });
    const res = await SubscriptionsPut(
      mockRequest("http://localhost/api/admin/subscriptions", { id: "s1", status: "CANCELLED" })
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.subscription.update).toHaveBeenCalled();
  });
});

describe("Admin Payments PUT — refund", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["ADMIN"] });
  });

  it("refunds a payment", async () => {
    mockPrisma.payment.update.mockResolvedValue({ id: "p1", status: "REFUNDED" });
    const res = await PaymentsPut(
      mockRequest("http://localhost/api/admin/payments", { id: "p1", status: "REFUNDED" })
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.payment.update).toHaveBeenCalled();
  });
});

describe("Admin Offers PUT — approve/reject", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["ADMIN"] });
  });

  it("approves an offer", async () => {
    mockPrisma.offer.update.mockResolvedValue({ id: "o1", status: "ACCEPTED" });
    const res = await OffersPut(
      mockRequest("http://localhost/api/admin/offers", { id: "o1", status: "ACCEPTED" })
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.offer.update).toHaveBeenCalled();
  });
});

describe("Admin Documents PUT/DELETE", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["ADMIN"] });
  });

  it("updates document verification status", async () => {
    mockPrisma.document.update.mockResolvedValue({ id: "d1", verificationStatus: "VERIFIED" });
    const res = await DocumentsPut(
      mockRequest("http://localhost/api/admin/documents", { id: "d1", verificationStatus: "VERIFIED" })
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.document.update).toHaveBeenCalled();
  });

  it("deletes a document", async () => {
    mockPrisma.document.delete.mockResolvedValue({ id: "d1" });
    const res = await DocumentsDelete(
      mockRequest("http://localhost/api/admin/documents?id=d1")
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.document.delete).toHaveBeenCalledWith({ where: { id: "d1" } });
  });
});

describe("Admin Workflow Detail PUT — add note", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["ADMIN"] });
  });

  it("adds a note to a workflow", async () => {
    mockPrisma.workflowNote.create.mockResolvedValue({ id: "n1" });
    mockPrisma.propertyWorkflow.update.mockResolvedValue({ id: "w1" });
    const res = await WorkflowDetailPut(
      mockRequest("http://localhost/api/admin/workflows/w1", { noteText: "Test note" }),
      mockParams("w1")
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.workflowNote.create).toHaveBeenCalled();
  });
});

describe("Admin CMS — new entity types", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["ADMIN"] });
  });

  it("creates a testimonial", async () => {
    mockPrisma.testimonial.create.mockResolvedValue({ id: "t1", name: "Test" });
    const res = await CmsPost(
      mockRequest("http://localhost/api/admin/cms", {
        entityType: "testimonial",
        data: { name: "Test", role: "Buyer", country: "Ghana", quote: "Great", rating: 5 },
      })
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.testimonial.create).toHaveBeenCalled();
  });

  it("creates a homepage step", async () => {
    mockPrisma.homepageStep.create.mockResolvedValue({ id: "s1" });
    const res = await CmsPost(
      mockRequest("http://localhost/api/admin/cms", {
        entityType: "homepageStep",
        data: { icon: "Search", title: "Step 1", description: "Desc" },
      })
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.homepageStep.create).toHaveBeenCalled();
  });

  it("creates a homepage region", async () => {
    mockPrisma.homepageRegion.create.mockResolvedValue({ id: "r1" });
    const res = await CmsPost(
      mockRequest("http://localhost/api/admin/cms", {
        entityType: "homepageRegion",
        data: { name: "Greater Accra", count: 245, image: "/images/test.jpg" },
      })
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.homepageRegion.create).toHaveBeenCalled();
  });

  it("creates hero content", async () => {
    mockPrisma.heroContent.create.mockResolvedValue({ id: "h1" });
    const res = await CmsPost(
      mockRequest("http://localhost/api/admin/cms", {
        entityType: "heroContent",
        data: { eyebrow: "Test", headline: "Test", subheadline: "Test" },
      })
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.heroContent.create).toHaveBeenCalled();
  });

  it("deletes a testimonial", async () => {
    mockPrisma.testimonial.delete.mockResolvedValue({ id: "t1" });
    const res = await CmsDelete(
      mockRequest("http://localhost/api/admin/cms?entityType=testimonial&id=t1")
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.testimonial.delete).toHaveBeenCalledWith({ where: { id: "t1" } });
  });
});

describe("Contact form POST", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a contact message with valid data", async () => {
    mockPrisma.contactMessage.create.mockResolvedValue({ id: "c1" });
    const res = await ContactPost(
      mockRequest("http://localhost/api/contact", {
        name: "John Doe",
        email: "john@example.com",
        subject: "General enquiry",
        message: "This is a test message that is long enough.",
      })
    );
    expect(res.status).toBe(201);
    expect(mockPrisma.contactMessage.create).toHaveBeenCalled();
  });

  it("rejects invalid email", async () => {
    const res = await ContactPost(
      mockRequest("http://localhost/api/contact", {
        name: "John",
        email: "not-an-email",
        subject: "Test",
        message: "A valid message here.",
      })
    );
    expect(res.status).toBe(400);
  });

  it("rejects short message", async () => {
    const res = await ContactPost(
      mockRequest("http://localhost/api/contact", {
        name: "John",
        email: "john@example.com",
        subject: "Test",
        message: "short",
      })
    );
    expect(res.status).toBe(400);
  });
});

describe("Admin Transactions List GET — auth & escrow filters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await TransactionsListGet(mockRequest("http://localhost/api/admin/transactions"));
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["BUYER"] });
    const res = await TransactionsListGet(mockRequest("http://localhost/api/admin/transactions"));
    expect(res.status).toBe(403);
  });

  it("returns 200 for admin with transactions", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["ADMIN"] });
    mockPrisma.transaction.findMany.mockResolvedValue([]);
    const res = await TransactionsListGet(mockRequest("http://localhost/api/admin/transactions"));
    expect(res.status).toBe(200);
  });

  it("supports pending_admin_approval filter", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["ADMIN"] });
    mockPrisma.transaction.findMany.mockResolvedValue([]);
    const res = await TransactionsListGet(
      mockRequest("http://localhost/api/admin/transactions?filter=pending_admin_approval")
    );
    expect(res.status).toBe(200);
    // Verify the where clause includes milestone filter
    const callArgs = mockPrisma.transaction.findMany.mock.calls[0][0];
    expect(callArgs.where.milestones).toBeDefined();
    expect(callArgs.where.milestones.some.requiresAdminApproval).toBe(true);
    expect(callArgs.where.milestones.some.adminApprovedAt).toBeNull();
  });
});

describe("Admin Transaction Detail GET — release checklist", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["ADMIN"] });
  });

  it("returns 404 when transaction not found", async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue(null);
    const res = await TransactionDetailGet(
      mockRequest("http://localhost/api/admin/transactions/xyz"),
      mockParams("xyz")
    );
    expect(res.status).toBe(404);
  });

  it("includes releaseChecklist in response", async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue({
      id: "tx1",
      status: "FUNDED",
      agreedPriceGhs: BigInt(100000),
      platformFeeBps: 150,
      verificationDaysMin: 7,
      createdAt: new Date(),
      closedAt: null,
      listing: { id: "l1", title: "Test", region: "Accra", district: "D", priceGhs: BigInt(100000), sizeAcres: 5, verificationLevel: "LEVEL_2_PLATFORM_REVIEWED" },
      buyer: { id: "b1", fullName: "Buyer", phone: "123", email: "b@test.com", kycTier: "TIER_1_ID_UPLOAD", kycRequests: [] },
      seller: { id: "s1", fullName: "Seller", phone: "456", email: "s@test.com", kycTier: "TIER_2_GHANA_CARD", kycRequests: [{ status: "PASSED" }] },
      payments: [],
      disputes: [],
      milestones: [
        { id: "m1", name: "M1", sortOrder: 0, requiresBuyerApproval: true, requiresSellerApproval: true, requiresAdminApproval: false, buyerApprovedAt: new Date(), sellerApprovedAt: new Date(), adminApprovedAt: null },
      ],
    });
    const res = await TransactionDetailGet(
      mockRequest("http://localhost/api/admin/transactions/tx1"),
      mockParams("tx1")
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.releaseChecklist).toBeDefined();
    expect(json.releaseChecklist.sellerKycPassed).toBe(true);
    expect(json.releaseChecklist.buyerKycPassed).toBe(true);
    expect(json.releaseChecklist.allMilestonesApproved).toBe(true);
    expect(json.releaseChecklist.canRelease).toBe(true);
  });

  it("computes canRelease=false when seller KYC not passed", async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue({
      id: "tx2",
      status: "FUNDED",
      agreedPriceGhs: BigInt(50000),
      platformFeeBps: 150,
      verificationDaysMin: 7,
      createdAt: new Date(),
      closedAt: null,
      listing: { id: "l2", title: "Test 2", region: "Kumasi", district: "D", priceGhs: BigInt(50000), sizeAcres: 3, verificationLevel: "LEVEL_0_UNVERIFIED" },
      buyer: { id: "b2", fullName: "Buyer2", phone: "123", email: "b2@test.com", kycTier: "TIER_0_OTP", kycRequests: [] },
      seller: { id: "s2", fullName: "Seller2", phone: "456", email: "s2@test.com", kycTier: "TIER_1_ID_UPLOAD", kycRequests: [{ status: "PENDING" }] },
      payments: [],
      disputes: [],
      milestones: [],
    });
    const res = await TransactionDetailGet(
      mockRequest("http://localhost/api/admin/transactions/tx2"),
      mockParams("tx2")
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.releaseChecklist.sellerKycPassed).toBe(false);
    expect(json.releaseChecklist.buyerKycPassed).toBe(false);
    expect(json.releaseChecklist.canRelease).toBe(false);
  });
});

describe("Admin Transaction Detail PUT — release gating", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["ADMIN"] });
  });

  it("blocks release when checklist not met (seller KYC not passed)", async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue({
      id: "tx3",
      status: "FUNDED",
      verificationDaysMin: 7,
      buyer: { id: "b1", kycTier: "TIER_0_OTP", kycRequests: [] },
      seller: { id: "s1", kycTier: "TIER_1_ID_UPLOAD", kycRequests: [{ status: "PENDING" }] },
      payments: [],
      milestones: [],
    });
    const res = await TransactionDetailPut(
      mockRequest("http://localhost/api/admin/transactions/tx3", { action: "release" }),
      mockParams("tx3")
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.failures).toBeDefined();
    expect(json.failures.length).toBeGreaterThan(0);
  });

  it("allows release with force: true even when checklist not met", async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue({
      id: "tx4",
      status: "FUNDED",
      verificationDaysMin: 7,
      buyer: { id: "b1", kycTier: "TIER_0_OTP", kycRequests: [] },
      seller: { id: "s1", kycTier: "TIER_1_ID_UPLOAD", kycRequests: [{ status: "PENDING" }] },
      payments: [],
      milestones: [],
    });
    mockPrisma.transaction.update.mockResolvedValue({ id: "tx4", status: "RELEASED", closedAt: new Date() });
    const res = await TransactionDetailPut(
      mockRequest("http://localhost/api/admin/transactions/tx4", { action: "release", force: true }),
      mockParams("tx4")
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.transaction.update).toHaveBeenCalled();
  });

  it("allows release when all checklist items pass", async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue({
      id: "tx5",
      status: "READY_TO_RELEASE",
      verificationDaysMin: 7,
      buyer: { id: "b1", kycTier: "TIER_1_ID_UPLOAD", kycRequests: [{ status: "PASSED" }] },
      seller: { id: "s1", kycTier: "TIER_2_GHANA_CARD", kycRequests: [{ status: "PASSED" }] },
      payments: [{ createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }],
      milestones: [
        { requiresBuyerApproval: true, requiresSellerApproval: true, requiresAdminApproval: false, buyerApprovedAt: new Date(), sellerApprovedAt: new Date(), adminApprovedAt: null },
      ],
    });
    mockPrisma.transaction.update.mockResolvedValue({ id: "tx5", status: "RELEASED", closedAt: new Date() });
    const res = await TransactionDetailPut(
      mockRequest("http://localhost/api/admin/transactions/tx5", { action: "release" }),
      mockParams("tx5")
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.transaction.update).toHaveBeenCalled();
  });
});

describe("Admin Milestone Approval PUT", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin1" } });
    mockPrisma.user.findUnique.mockResolvedValue({ roles: ["ADMIN"] });
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await MilestoneApprovePut(
      mockRequest("http://localhost/api/admin/transactions/tx1/milestones/m1", { action: "approve" }),
      { params: Promise.resolve({ id: "tx1", milestoneId: "m1" }) }
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when transaction not found", async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue(null);
    const res = await MilestoneApprovePut(
      mockRequest("http://localhost/api/admin/transactions/tx1/milestones/m1", { action: "approve" }),
      { params: Promise.resolve({ id: "tx1", milestoneId: "m1" }) }
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 when milestone not found", async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue({ id: "tx1", status: "FUNDED" });
    mockPrisma.escrowMilestone.findUnique.mockResolvedValue(null);
    const res = await MilestoneApprovePut(
      mockRequest("http://localhost/api/admin/transactions/tx1/milestones/m99", { action: "approve" }),
      { params: Promise.resolve({ id: "tx1", milestoneId: "m99" }) }
    );
    expect(res.status).toBe(404);
  });

  it("approves a milestone requiring admin approval", async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue({ id: "tx1", status: "VERIFICATION_PERIOD" });
    mockPrisma.escrowMilestone.findUnique.mockResolvedValue({
      id: "m1",
      transactionId: "tx1",
      name: "Document Check",
      requiresAdminApproval: true,
      adminApprovedAt: null,
    });
    mockPrisma.escrowMilestone.update.mockResolvedValue({
      id: "m1",
      adminApprovedAt: new Date(),
    });
    mockPrisma.escrowMilestone.findMany.mockResolvedValue([
      { id: "m1", requiresBuyerApproval: true, requiresSellerApproval: true, requiresAdminApproval: true, buyerApprovedAt: new Date(), sellerApprovedAt: new Date(), adminApprovedAt: new Date() },
    ]);
    const res = await MilestoneApprovePut(
      mockRequest("http://localhost/api/admin/transactions/tx1/milestones/m1", { action: "approve" }),
      { params: Promise.resolve({ id: "tx1", milestoneId: "m1" }) }
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.escrowMilestone.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "m1" },
        data: expect.objectContaining({ adminApprovedAt: expect.any(Date) }),
      })
    );
    expect(mockPrisma.auditLog.create).toHaveBeenCalled();
  });

  it("rejects invalid action", async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue({ id: "tx1", status: "FUNDED" });
    const res = await MilestoneApprovePut(
      mockRequest("http://localhost/api/admin/transactions/tx1/milestones/m1", { action: "invalid" }),
      { params: Promise.resolve({ id: "tx1", milestoneId: "m1" }) }
    );
    expect(res.status).toBe(400);
  });
});

import { GET } from "@/app/api/health/route";

jest.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
  withDbRetry: jest.fn((fn: () => Promise<unknown>) => fn()),
}));

jest.mock("@/lib/env", () => ({
  checkServiceHealth: jest.fn(),
}));

import { prisma } from "@/lib/db";
import { checkServiceHealth } from "@/lib/env";

const mockPrisma = prisma as unknown as { $queryRaw: jest.Mock };
const mockCheckServiceHealth = checkServiceHealth as jest.Mock;

describe("GET /api/health", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.MEILISEARCH_HOST;
    mockCheckServiceHealth.mockReturnValue({
      database: true,
      theteller: true,
      sms: false,
      email: true,
      cloudinary: false,
      sentry: false,
      fcm: false,
      mapbox: true,
    });
  });

  it("should return 200 when the database is healthy", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe("healthy");
    expect(json.checks.database.status).toBe("ok");
    expect(typeof json.checks.database.latency).toBe("number");
  });

  it("should return 503 when the database is down", async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error("Connection refused"));

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.status).toBe("unhealthy");
    expect(json.checks.database.status).toBe("error");
    expect(json.checks.database.error).toContain("Connection refused");
  });

  it("should include service configuration health statuses", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.checks.theteller.status).toBe("configured");
    expect(json.checks.sms.status).toBe("not_configured");
    expect(json.checks.email.status).toBe("configured");
    expect(json.checks.cloudinary.status).toBe("not_configured");
    expect(json.checks.sentry.status).toBe("not_configured");
    expect(json.checks.fcm.status).toBe("not_configured");
    expect(json.checks.mapbox.status).toBe("configured");
    expect(mockCheckServiceHealth).toHaveBeenCalled();
  });
});

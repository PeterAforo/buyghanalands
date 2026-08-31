import { NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/db";
import { checkServiceHealth } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {};

  // Database check
  try {
    const dbStart = Date.now();
    await withDbRetry(() => prisma.$queryRaw`SELECT 1`);
    checks.database = { status: "ok", latency: Date.now() - dbStart };
  } catch (error) {
    checks.database = {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Meilisearch check (optional, only if configured)
  try {
    const msStart = Date.now();
    const msHost = process.env.MEILISEARCH_HOST;
    if (msHost) {
      const response = await fetch(`${msHost}/health`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.MEILISEARCH_API_KEY}`,
        },
      });
      if (response.ok) {
        checks.meilisearch = { status: "ok", latency: Date.now() - msStart };
      } else {
        checks.meilisearch = { status: "error", error: `HTTP ${response.status}` };
      }
    }
  } catch (error) {
    checks.meilisearch = {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Service configuration checks (which services are configured via env vars)
  const serviceHealth = checkServiceHealth();
  checks.theteller = { status: serviceHealth.theteller ? "configured" : "not_configured" };
  checks.sms = { status: serviceHealth.sms ? "configured" : "not_configured" };
  checks.email = { status: serviceHealth.email ? "configured" : "not_configured" };
  checks.cloudinary = { status: serviceHealth.cloudinary ? "configured" : "not_configured" };
  checks.sentry = { status: serviceHealth.sentry ? "configured" : "not_configured" };
  checks.fcm = { status: serviceHealth.fcm ? "configured" : "not_configured" };
  checks.mapbox = { status: serviceHealth.mapbox ? "configured" : "not_configured" };

  // Database is the critical service — return 503 if it's down
  const dbHealthy = checks.database.status === "ok";
  const totalLatency = Date.now() - startTime;

  return NextResponse.json(
    {
      status: dbHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
      uptime: process.uptime(),
      latency: totalLatency,
      checks,
    },
    { status: dbHealthy ? 200 : 503 }
  );
}

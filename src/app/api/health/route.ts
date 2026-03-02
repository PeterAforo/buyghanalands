import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: "ok" | "error"; latency?: number; error?: string }> = {};

  // Database check
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok", latency: Date.now() - dbStart };
  } catch (error) {
    checks.database = {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Meilisearch check (optional)
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

  const allHealthy = Object.values(checks).every((c) => c.status === "ok");
  const totalLatency = Date.now() - startTime;

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
      uptime: process.uptime(),
      latency: totalLatency,
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  );
}

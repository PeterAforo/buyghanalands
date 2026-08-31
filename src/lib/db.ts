import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use standard Prisma client - it will use DATABASE_URL from schema.prisma
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

/**
 * Wraps an async database operation with retry logic to handle
 * Neon serverless Postgres cold-start connection failures.
 *
 * Neon scales compute to zero when idle; the first request after a
 * cold start can time out before the database wakes up. This helper
 * retries the operation a few times with a short delay.
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  options: { retries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  const { retries = 3, baseDelayMs = 1000 } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const message =
        error instanceof Error ? error.message : String(error);
      const isConnectionError =
        message.includes("Can't reach database server") ||
        message.includes("Connection terminated") ||
        message.includes("Connection timeout") ||
        message.includes("Timed out") ||
        message.includes("ECONNRESET") ||
        message.includes("ETIMEDOUT") ||
        message.includes("PrismaClientInitializationError");

      if (!isConnectionError || attempt === retries) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s...
      const delay = baseDelayMs * Math.pow(2, attempt);
      console.warn(
        `Database connection failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms...`
      );
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

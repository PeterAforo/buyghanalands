import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
};

export default withSentryConfig(nextConfig, {
  // Only relevant if you use `sentry.config.ts` files
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs when uploading source maps
  silent: !process.env.CI,

  // Upload source maps in production
  widenClientFileUpload: true,
});

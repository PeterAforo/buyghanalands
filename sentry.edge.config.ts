import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "",

  // Adjust this value in production, or use tracesSampler for greater control
  // 0.1 = 10% of transactions sampled. Lower to 0.05 if volume is high.
  tracesSampleRate: 0.1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry
  debug: false,

  // Disable Sentry if no DSN is configured
  enabled: !!process.env.SENTRY_DSN,
});

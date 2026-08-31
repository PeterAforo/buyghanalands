/**
 * Environment variable validation module.
 *
 * Validates all required environment variables at startup and provides a typed
 * config object. `validateEnv()` is only invoked when `getEnv()` is first
 * called, so importing this module never crashes the app even if optional vars
 * are missing.
 */

interface EnvConfig {
  database: { url: string; directUrl: string };
  auth: { secret: string; url: string; appUrl: string };
  theteller: {
    merchantId: string;
    apiUser: string;
    apiKey: string;
    passCode: string;
    baseUrl: string;
    checkoutUrl: string;
  };
  meilisearch: { host: string; apiKey: string };
  sms: {
    mnotifyApiKey: string;
    mnotifySenderId: string;
    hubtelClientId?: string;
    hubtelClientSecret?: string;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser?: string;
    smtpPass?: string;
    fromEmail: string;
    fromName: string;
  };
  cloudinary: { cloudName: string; apiKey: string; apiSecret: string };
  sentry: { dsn?: string };
  fcm: { serverKey?: string };
  apple: {
    clientId?: string;
    teamId?: string;
    keyId?: string;
    privateKey?: string;
  };
  mapbox: { accessToken?: string };
  blob: { token?: string };
}

interface ServiceHealth {
  database: boolean;
  theteller: boolean;
  meilisearch: boolean;
  sms: boolean;
  email: boolean;
  cloudinary: boolean;
  sentry: boolean;
  fcm: boolean;
  mapbox: boolean;
}

const isNonEmpty = (value: string | undefined): value is string =>
  typeof value === "string" && value.trim().length > 0;

/**
 * Validates all required environment variables and returns a typed config
 * object. Throws an Error listing ALL missing required vars (not just the
 * first one). Missing optional vars produce a console warning but do not throw.
 */
function validateEnv(): EnvConfig {
  const required: Record<string, string | undefined> = {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  const missingRequired = Object.entries(required)
    .filter(([, value]) => !isNonEmpty(value))
    .map(([key]) => key);

  if (missingRequired.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingRequired.join(", ")}. ` +
        `Please set them in your .env file before starting the application.`,
    );
  }

  // Optional vars — warn but don't throw.
  const optional: Record<string, string | undefined> = {
    THETELLER_MERCHANT_ID: process.env.THETELLER_MERCHANT_ID,
    THETELLER_API_USER: process.env.THETELLER_API_USER,
    THETELLER_API_KEY: process.env.THETELLER_API_KEY,
    THETELLER_PASS_CODE: process.env.THETELLER_PASS_CODE,
    THETELLER_BASE_URL: process.env.THETELLER_BASE_URL,
    THETELLER_CHECKOUT_URL: process.env.THETELLER_CHECKOUT_URL,
    MEILISEARCH_HOST: process.env.MEILISEARCH_HOST,
    MEILISEARCH_API_KEY: process.env.MEILISEARCH_API_KEY,
    MNOTIFY_API_KEY: process.env.MNOTIFY_API_KEY,
    MNOTIFY_SENDER_ID: process.env.MNOTIFY_SENDER_ID,
    HUBTEL_CLIENT_ID: process.env.HUBTEL_CLIENT_ID,
    HUBTEL_CLIENT_SECRET: process.env.HUBTEL_CLIENT_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL,
    SMTP_FROM_NAME: process.env.SMTP_FROM_NAME,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    SENTRY_DSN: process.env.SENTRY_DSN,
    FCM_SERVER_KEY: process.env.FCM_SERVER_KEY,
    APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID,
    APPLE_TEAM_ID: process.env.APPLE_TEAM_ID,
    APPLE_KEY_ID: process.env.APPLE_KEY_ID,
    APPLE_PRIVATE_KEY: process.env.APPLE_PRIVATE_KEY,
    MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  };

  const missingOptional = Object.entries(optional)
    .filter(([, value]) => !isNonEmpty(value))
    .map(([key]) => key);

  if (missingOptional.length > 0) {
    console.warn(
      `[env] Missing optional environment variables: ${missingOptional.join(", ")}. ` +
        `Some features may be unavailable.`,
    );
  }

  // Parse SMTP_PORT to number (default to 587 if invalid/missing).
  const smtpPortRaw = process.env.SMTP_PORT;
  const smtpPort = smtpPortRaw ? Number.parseInt(smtpPortRaw, 10) : 587;
  const parsedSmtpPort = Number.isNaN(smtpPort) ? 587 : smtpPort;

  // Parse SMTP_SECURE to boolean (treat "true"/"1"/"yes" as true).
  const smtpSecureRaw = process.env.SMTP_SECURE;
  const parsedSmtpSecure =
    typeof smtpSecureRaw === "string" &&
    ["true", "1", "yes"].includes(smtpSecureRaw.trim().toLowerCase());

  return {
    database: {
      url: process.env.DATABASE_URL!,
      directUrl: process.env.DIRECT_URL!,
    },
    auth: {
      secret: process.env.AUTH_SECRET!,
      url: process.env.NEXTAUTH_URL!,
      appUrl: process.env.NEXT_PUBLIC_APP_URL!,
    },
    theteller: {
      merchantId: process.env.THETELLER_MERCHANT_ID ?? "",
      apiUser: process.env.THETELLER_API_USER ?? "",
      apiKey: process.env.THETELLER_API_KEY ?? "",
      passCode: process.env.THETELLER_PASS_CODE ?? "",
      baseUrl: process.env.THETELLER_BASE_URL ?? "",
      checkoutUrl: process.env.THETELLER_CHECKOUT_URL ?? "",
    },
    meilisearch: {
      host: process.env.MEILISEARCH_HOST ?? "",
      apiKey: process.env.MEILISEARCH_API_KEY ?? "",
    },
    sms: {
      mnotifyApiKey: process.env.MNOTIFY_API_KEY ?? "",
      mnotifySenderId: process.env.MNOTIFY_SENDER_ID ?? "",
      hubtelClientId: process.env.HUBTEL_CLIENT_ID || undefined,
      hubtelClientSecret: process.env.HUBTEL_CLIENT_SECRET || undefined,
    },
    email: {
      smtpHost: process.env.SMTP_HOST ?? "",
      smtpPort: parsedSmtpPort,
      smtpSecure: parsedSmtpSecure,
      smtpUser: process.env.SMTP_USER || undefined,
      smtpPass: process.env.SMTP_PASS || undefined,
      fromEmail: process.env.SMTP_FROM_EMAIL ?? "",
      fromName: process.env.SMTP_FROM_NAME ?? "",
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
      apiKey: process.env.CLOUDINARY_API_KEY ?? "",
      apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
    },
    sentry: {
      dsn: process.env.SENTRY_DSN || undefined,
    },
    fcm: {
      serverKey: process.env.FCM_SERVER_KEY || undefined,
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID || undefined,
      teamId: process.env.APPLE_TEAM_ID || undefined,
      keyId: process.env.APPLE_KEY_ID || undefined,
      privateKey: process.env.APPLE_PRIVATE_KEY || undefined,
    },
    mapbox: {
      accessToken: process.env.MAPBOX_ACCESS_TOKEN || undefined,
    },
    blob: {
      token: process.env.BLOB_READ_WRITE_TOKEN || undefined,
    },
  };
}

let _env: EnvConfig | null = null;

/**
 * Returns the validated environment config, initializing it lazily on first
 * call. Subsequent calls return the cached config.
 */
export function getEnv(): EnvConfig {
  if (!_env) _env = validateEnv();
  return _env;
}

/**
 * Checks which services are configured (relevant env vars are non-empty)
 * without throwing. Useful for health checks and feature gating.
 */
export function checkServiceHealth(): ServiceHealth {
  const env = process.env;

  return {
    database: isNonEmpty(env.DATABASE_URL) && isNonEmpty(env.DIRECT_URL),
    theteller:
      isNonEmpty(env.THETELLER_MERCHANT_ID) &&
      isNonEmpty(env.THETELLER_API_USER) &&
      isNonEmpty(env.THETELLER_API_KEY) &&
      isNonEmpty(env.THETELLER_PASS_CODE) &&
      isNonEmpty(env.THETELLER_BASE_URL) &&
      isNonEmpty(env.THETELLER_CHECKOUT_URL),
    meilisearch: isNonEmpty(env.MEILISEARCH_HOST) && isNonEmpty(env.MEILISEARCH_API_KEY),
    sms:
      isNonEmpty(env.MNOTIFY_API_KEY) && isNonEmpty(env.MNOTIFY_SENDER_ID),
    email:
      isNonEmpty(env.SMTP_HOST) &&
      isNonEmpty(env.SMTP_FROM_EMAIL) &&
      isNonEmpty(env.SMTP_FROM_NAME),
    cloudinary:
      isNonEmpty(env.CLOUDINARY_CLOUD_NAME) &&
      isNonEmpty(env.CLOUDINARY_API_KEY) &&
      isNonEmpty(env.CLOUDINARY_API_SECRET),
    sentry: isNonEmpty(env.SENTRY_DSN),
    fcm: isNonEmpty(env.FCM_SERVER_KEY),
    mapbox: isNonEmpty(env.MAPBOX_ACCESS_TOKEN),
  };
}

export type { EnvConfig, ServiceHealth };

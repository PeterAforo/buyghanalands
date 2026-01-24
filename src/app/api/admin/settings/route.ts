import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.AUTH_SECRET || "default-key-change-in-production";

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text: string): string {
  try {
    const [ivHex, encrypted] = text.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return text;
  }
}

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.includes("ADMIN") || false;
}

// Settings that should be encrypted
const SENSITIVE_KEYS = [
  "SMTP_PASS", "PAYSTACK_SECRET_KEY", "MNOTIFY_API_KEY", 
  "S3_SECRET_KEY", "FCM_SERVER_KEY", "AUTH_SECRET"
];

// Default settings structure
const DEFAULT_SETTINGS: Record<string, Record<string, { value: string; description: string; isEncrypted: boolean }>> = {
  smtp: {
    SMTP_HOST: { value: "smtp.gmail.com", description: "SMTP server hostname", isEncrypted: false },
    SMTP_PORT: { value: "587", description: "SMTP server port", isEncrypted: false },
    SMTP_SECURE: { value: "false", description: "Use TLS (true/false)", isEncrypted: false },
    SMTP_USER: { value: "", description: "SMTP username/email", isEncrypted: false },
    SMTP_PASS: { value: "", description: "SMTP password or app password", isEncrypted: true },
    FROM_EMAIL: { value: "", description: "Sender email address", isEncrypted: false },
    FROM_NAME: { value: "BuyGhanaLands", description: "Sender display name", isEncrypted: false },
  },
  payment: {
    PAYSTACK_PUBLIC_KEY: { value: "", description: "Paystack public key", isEncrypted: false },
    PAYSTACK_SECRET_KEY: { value: "", description: "Paystack secret key", isEncrypted: true },
  },
  sms: {
    MNOTIFY_API_KEY: { value: "", description: "mNotify API key for SMS", isEncrypted: true },
    SMS_SENDER_ID: { value: "BuyGhanaLnd", description: "SMS sender ID (max 11 chars)", isEncrypted: false },
  },
  storage: {
    S3_ENDPOINT: { value: "", description: "S3/R2 endpoint URL", isEncrypted: false },
    S3_BUCKET: { value: "buyghanalands", description: "S3 bucket name", isEncrypted: false },
    S3_ACCESS_KEY: { value: "", description: "S3 access key ID", isEncrypted: false },
    S3_SECRET_KEY: { value: "", description: "S3 secret access key", isEncrypted: true },
    S3_REGION: { value: "auto", description: "S3 region", isEncrypted: false },
  },
  maps: {
    MAPBOX_ACCESS_TOKEN: { value: "", description: "Mapbox public access token", isEncrypted: false },
  },
  notifications: {
    FCM_SERVER_KEY: { value: "", description: "Firebase Cloud Messaging server key", isEncrypted: true },
  },
  platform: {
    PLATFORM_FEE_PERCENT: { value: "2.5", description: "Platform fee percentage on transactions", isEncrypted: false },
    ESCROW_HOLD_DAYS: { value: "7", description: "Days to hold funds in escrow", isEncrypted: false },
    MAX_LISTING_IMAGES: { value: "10", description: "Maximum images per listing", isEncrypted: false },
    MAX_DOCUMENT_SIZE_MB: { value: "10", description: "Maximum document size in MB", isEncrypted: false },
    MAINTENANCE_MODE: { value: "false", description: "Enable maintenance mode", isEncrypted: false },
  },
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    // Fetch settings from database
    const dbSettings = await prisma.systemSetting.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    // Build response with defaults and DB values
    const result: Record<string, Record<string, { value: string; description: string; isEncrypted: boolean }>> = {};

    // First, add all default settings
    for (const [cat, keys] of Object.entries(DEFAULT_SETTINGS)) {
      if (category && cat !== category) continue;
      
      result[cat] = {};
      for (const [key, defaultVal] of Object.entries(keys)) {
        const dbSetting = dbSettings.find(s => s.category === cat && s.key === key);
        if (dbSetting) {
          result[cat][key] = {
            value: dbSetting.isEncrypted ? "••••••••" : dbSetting.value,
            description: dbSetting.description || defaultVal.description,
            isEncrypted: dbSetting.isEncrypted,
          };
        } else {
          result[cat][key] = defaultVal;
        }
      }
    }

    // Then, add any custom settings from DB that aren't in defaults
    for (const dbSetting of dbSettings) {
      if (category && dbSetting.category !== category) continue;
      
      if (!result[dbSetting.category]) {
        result[dbSetting.category] = {};
      }
      
      // Only add if not already present (custom settings)
      if (!result[dbSetting.category][dbSetting.key]) {
        result[dbSetting.category][dbSetting.key] = {
          value: dbSetting.isEncrypted ? "••••••••" : dbSetting.value,
          description: dbSetting.description || `Custom ${dbSetting.category} setting`,
          isEncrypted: dbSetting.isEncrypted,
        };
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { category, settings } = body as { category: string; settings: Record<string, string> };

    if (!category || !settings) {
      return NextResponse.json({ error: "Category and settings required" }, { status: 400 });
    }

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      if (value === "••••••••") continue; // Skip masked values
      
      // Check if it's a known sensitive key or if it was previously marked as encrypted
      const existingSetting = await prisma.systemSetting.findUnique({
        where: { category_key: { category, key } },
      });
      
      const isEncrypted = SENSITIVE_KEYS.includes(key) || existingSetting?.isEncrypted || false;
      const storedValue = isEncrypted ? encrypt(value) : value;

      await prisma.systemSetting.upsert({
        where: { category_key: { category, key } },
        update: {
          value: storedValue,
          updatedBy: session.user.id,
        },
        create: {
          category,
          key,
          value: storedValue,
          isEncrypted,
          description: DEFAULT_SETTINGS[category]?.[key]?.description || existingSetting?.description || "",
          updatedBy: session.user.id,
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "LISTING",
        entityId: "system-settings",
        actorType: "USER",
        actorUserId: session.user.id,
        action: "UPDATE",
        diff: { category, keys: Object.keys(settings) },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { category, key } = body as { category: string; key: string };

    if (!category || !key) {
      return NextResponse.json({ error: "Category and key required" }, { status: 400 });
    }

    // Delete the setting
    await prisma.systemSetting.delete({
      where: { category_key: { category, key } },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "LISTING",
        entityId: "system-settings",
        actorType: "USER",
        actorUserId: session.user.id,
        action: "DELETE",
        diff: { category, key },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting setting:", error);
    return NextResponse.json({ error: "Failed to delete setting" }, { status: 500 });
  }
}

// Helper to get a setting value (for use in other parts of the app)
export async function getSetting(category: string, key: string): Promise<string | null> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { category_key: { category, key } },
    });
    
    if (!setting) {
      return DEFAULT_SETTINGS[category]?.[key]?.value || null;
    }
    
    return setting.isEncrypted ? decrypt(setting.value) : setting.value;
  } catch {
    return null;
  }
}

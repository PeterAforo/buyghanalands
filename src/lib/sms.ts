// SMS Provider Configuration
const MNOTIFY_API_KEY = process.env.MNOTIFY_API_KEY;
const MNOTIFY_SENDER_ID = process.env.MNOTIFY_SENDER_ID || "BuyGhLands";
const HUBTEL_CLIENT_ID = process.env.HUBTEL_CLIENT_ID;
const HUBTEL_CLIENT_SECRET = process.env.HUBTEL_CLIENT_SECRET;
const HUBTEL_SENDER_ID = process.env.HUBTEL_SENDER_ID || "BuyGhLands";
const SMS_PROVIDER = process.env.SMS_PROVIDER || "mnotify"; // "mnotify" or "hubtel"

interface SendSMSResponse {
  success: boolean;
  message: string;
  messageId?: string;
  provider?: string;
}

// Format phone number for Ghana
function formatGhanaPhone(phone: string): string {
  let formatted = phone.replace(/\s+/g, "").replace(/^0/, "").replace(/^\+/, "");
  if (!formatted.startsWith("233")) {
    formatted = `233${formatted}`;
  }
  return formatted;
}

// mNotify SMS Provider
async function sendViaMNotify(phone: string, message: string): Promise<SendSMSResponse> {
  if (!MNOTIFY_API_KEY) {
    return { success: false, message: "mNotify API key not configured", provider: "mnotify" };
  }

  try {
    const formattedPhone = formatGhanaPhone(phone);
    const response = await fetch("https://apps.mnotify.net/smsapi", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        key: MNOTIFY_API_KEY,
        to: formattedPhone,
        msg: message,
        sender_id: MNOTIFY_SENDER_ID,
      }),
    });

    const result = await response.text();
    
    if (result.includes("1000")) {
      return { success: true, message: "SMS sent successfully", provider: "mnotify" };
    }

    return { success: false, message: `mNotify error: ${result}`, provider: "mnotify" };
  } catch (error) {
    console.error("mNotify SMS error:", error);
    return { success: false, message: "mNotify request failed", provider: "mnotify" };
  }
}

// Hubtel SMS Provider
async function sendViaHubtel(phone: string, message: string): Promise<SendSMSResponse> {
  if (!HUBTEL_CLIENT_ID || !HUBTEL_CLIENT_SECRET) {
    return { success: false, message: "Hubtel credentials not configured", provider: "hubtel" };
  }

  try {
    const formattedPhone = formatGhanaPhone(phone);
    const auth = Buffer.from(`${HUBTEL_CLIENT_ID}:${HUBTEL_CLIENT_SECRET}`).toString("base64");
    
    const response = await fetch("https://smsc.hubtel.com/v1/messages/send", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        From: HUBTEL_SENDER_ID,
        To: formattedPhone,
        Content: message,
      }),
    });

    const result = await response.json();
    
    if (response.ok && result.MessageId) {
      return { success: true, message: "SMS sent successfully", messageId: result.MessageId, provider: "hubtel" };
    }

    return { success: false, message: result.Message || "Hubtel error", provider: "hubtel" };
  } catch (error) {
    console.error("Hubtel SMS error:", error);
    return { success: false, message: "Hubtel request failed", provider: "hubtel" };
  }
}

// Main SMS send function with fallback
export async function sendSMS(phone: string, message: string): Promise<SendSMSResponse> {
  // Try primary provider
  let result: SendSMSResponse;
  
  if (SMS_PROVIDER === "hubtel") {
    result = await sendViaHubtel(phone, message);
    if (!result.success && MNOTIFY_API_KEY) {
      // Fallback to mNotify
      console.log("Hubtel failed, falling back to mNotify");
      result = await sendViaMNotify(phone, message);
    }
  } else {
    result = await sendViaMNotify(phone, message);
    if (!result.success && HUBTEL_CLIENT_ID) {
      // Fallback to Hubtel
      console.log("mNotify failed, falling back to Hubtel");
      result = await sendViaHubtel(phone, message);
    }
  }

  return result;
}

export function generateOTP(length: number = 6): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

export async function sendOTP(phone: string): Promise<{ success: boolean; otp?: string; message: string }> {
  const otp = generateOTP();
  const message = `Your BuyGhanaLands verification code is: ${otp}. Valid for 10 minutes.`;
  
  const result = await sendSMS(phone, message);
  
  if (result.success) {
    return { success: true, otp, message: "OTP sent successfully" };
  }
  
  return { success: false, message: result.message };
}

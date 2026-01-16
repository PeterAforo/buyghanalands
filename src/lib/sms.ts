const MNOTIFY_API_KEY = process.env.MNOTIFY_API_KEY;
const MNOTIFY_SENDER_ID = process.env.MNOTIFY_SENDER_ID || "BuyGhLands";

interface SendSMSResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

export async function sendSMS(phone: string, message: string): Promise<SendSMSResponse> {
  if (!MNOTIFY_API_KEY) {
    console.error("MNOTIFY_API_KEY not configured");
    return { success: false, message: "SMS service not configured" };
  }

  try {
    // Format phone number for Ghana (remove leading 0, add country code)
    let formattedPhone = phone.replace(/\s+/g, "").replace(/^0/, "");
    if (!formattedPhone.startsWith("233")) {
      formattedPhone = `233${formattedPhone}`;
    }

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
    
    // mNotify returns "1000" for success
    if (result.includes("1000")) {
      return { success: true, message: "SMS sent successfully" };
    }

    return { success: false, message: `SMS failed: ${result}` };
  } catch (error) {
    console.error("SMS send error:", error);
    return { success: false, message: "Failed to send SMS" };
  }
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

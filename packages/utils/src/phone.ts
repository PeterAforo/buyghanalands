// Ghana phone number utilities

/**
 * Normalize a Ghana phone number to international format (+233XXXXXXXXX)
 */
export function normalizeGhanaPhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");
  
  // Already in international format with country code
  if (digits.startsWith("233") && digits.length === 12) {
    return `+${digits}`;
  }
  
  // Local format starting with 0
  if (digits.startsWith("0") && digits.length === 10) {
    return `+233${digits.slice(1)}`;
  }
  
  // Just the 9 digits without prefix
  if (digits.length === 9) {
    return `+233${digits}`;
  }
  
  // Return as-is if we can't normalize
  return phone;
}

/**
 * Convert international format to local format (0XXXXXXXXX)
 */
export function toLocalFormat(phone: string): string {
  const normalized = normalizeGhanaPhone(phone);
  
  if (normalized.startsWith("+233")) {
    return `0${normalized.slice(4)}`;
  }
  
  return phone;
}

/**
 * Get the network provider from a Ghana phone number
 */
export function getNetworkProvider(phone: string): string | null {
  const normalized = normalizeGhanaPhone(phone);
  
  if (!normalized.startsWith("+233") || normalized.length !== 13) {
    return null;
  }
  
  const networkCode = normalized.slice(4, 6);
  
  const providers: Record<string, string> = {
    "20": "Vodafone",
    "23": "Glo",
    "24": "MTN",
    "26": "AirtelTigo",
    "27": "AirtelTigo",
    "50": "Vodafone",
    "54": "MTN",
    "55": "MTN",
    "56": "AirtelTigo",
    "57": "AirtelTigo",
    "59": "MTN",
  };
  
  return providers[networkCode] || null;
}

/**
 * Check if a phone number is a mobile money number
 * (All Ghana mobile numbers can be used for mobile money)
 */
export function isMobileMoneyCapable(phone: string): boolean {
  const provider = getNetworkProvider(phone);
  return provider !== null;
}

/**
 * Mask a phone number for privacy (e.g., +233 ** *** **67)
 */
export function maskPhoneNumber(phone: string): string {
  const normalized = normalizeGhanaPhone(phone);
  
  if (normalized.startsWith("+233") && normalized.length === 13) {
    return `+233 ** *** **${normalized.slice(-2)}`;
  }
  
  // Fallback: show first 3 and last 2 characters
  if (phone.length > 5) {
    return `${phone.slice(0, 3)}${"*".repeat(phone.length - 5)}${phone.slice(-2)}`;
  }
  
  return phone;
}

/**
 * Parse phone input and return structured data
 */
export function parsePhoneInput(input: string): {
  normalized: string;
  local: string;
  isValid: boolean;
  provider: string | null;
} {
  const normalized = normalizeGhanaPhone(input);
  const local = toLocalFormat(normalized);
  const provider = getNetworkProvider(normalized);
  const isValid = provider !== null;
  
  return {
    normalized,
    local,
    isValid,
    provider,
  };
}

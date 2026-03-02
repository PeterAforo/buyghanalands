// Validation utilities for BuyGhanaLands

/**
 * Validate Ghana phone number
 */
export function isValidGhanaPhone(phone: string): boolean {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");
  
  // Check for valid Ghana phone formats
  // +233XXXXXXXXX (12 digits)
  // 233XXXXXXXXX (12 digits)
  // 0XXXXXXXXX (10 digits)
  
  if (digits.length === 12 && digits.startsWith("233")) {
    const networkCode = digits.slice(3, 5);
    return isValidNetworkCode(networkCode);
  }
  
  if (digits.length === 10 && digits.startsWith("0")) {
    const networkCode = digits.slice(1, 3);
    return isValidNetworkCode(networkCode);
  }
  
  return false;
}

/**
 * Check if network code is valid for Ghana
 */
function isValidNetworkCode(code: string): boolean {
  // MTN: 24, 54, 55, 59
  // Vodafone: 20, 50
  // AirtelTigo: 26, 27, 56, 57
  // Glo: 23
  const validCodes = ["20", "23", "24", "26", "27", "50", "54", "55", "56", "57", "59"];
  return validCodes.includes(code);
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate listing price
 */
export function isValidPrice(price: number): boolean {
  return price > 0 && price <= 100_000_000_000; // Max 100 billion GHS
}

/**
 * Validate land size in acres
 */
export function isValidLandSize(acres: number): boolean {
  return acres > 0 && acres <= 100_000; // Max 100,000 acres
}

/**
 * Validate Ghana Card number
 */
export function isValidGhanaCard(cardNumber: string): boolean {
  // Ghana Card format: GHA-XXXXXXXXX-X
  const ghanaCardRegex = /^GHA-\d{9}-\d$/;
  return ghanaCardRegex.test(cardNumber.toUpperCase());
}

/**
 * Validate OTP code
 */
export function isValidOtp(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}

/**
 * Validate coordinates are within Ghana
 */
export function isWithinGhana(lat: number, lng: number): boolean {
  // Ghana bounding box (approximate)
  const bounds = {
    north: 11.2,
    south: 4.5,
    east: 1.2,
    west: -3.3,
  };
  
  return (
    lat >= bounds.south &&
    lat <= bounds.north &&
    lng >= bounds.west &&
    lng <= bounds.east
  );
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .slice(0, 10000); // Limit length
}

/**
 * Validate file type for upload
 */
export function isValidImageType(mimeType: string): boolean {
  const validTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ];
  return validTypes.includes(mimeType);
}

/**
 * Validate file type for documents
 */
export function isValidDocumentType(mimeType: string): boolean {
  const validTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];
  return validTypes.includes(mimeType);
}

/**
 * Validate file size (in bytes)
 */
export function isValidFileSize(size: number, maxMB: number = 10): boolean {
  return size > 0 && size <= maxMB * 1024 * 1024;
}

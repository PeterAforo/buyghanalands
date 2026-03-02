// Formatting utilities for BuyGhanaLands

/**
 * Format a number as Ghana Cedis currency
 */
export function formatCurrency(
  amount: number,
  options: { showSymbol?: boolean; decimals?: number } = {}
): string {
  const { showSymbol = true, decimals = 0 } = options;
  
  const formatted = new Intl.NumberFormat("en-GH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  return showSymbol ? `GHS ${formatted}` : formatted;
}

/**
 * Format a number with compact notation (e.g., 1.5M, 500K)
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return num.toString();
}

/**
 * Format land size in acres
 */
export function formatAcres(acres: number): string {
  if (acres < 1) {
    // Convert to plots (assuming 1 acre = 6 plots)
    const plots = Math.round(acres * 6);
    return `${plots} plot${plots !== 1 ? "s" : ""}`;
  }
  return `${acres.toFixed(2).replace(/\.00$/, "")} acre${acres !== 1 ? "s" : ""}`;
}

/**
 * Format a date relative to now
 */
export function formatRelativeDate(date: Date | string): string {
  const now = new Date();
  const target = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - target.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;

  return target.toLocaleDateString("en-GH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a date for display
 */
export function formatDate(
  date: Date | string,
  options: { includeTime?: boolean } = {}
): string {
  const target = typeof date === "string" ? new Date(date) : date;
  
  const dateStr = target.toLocaleDateString("en-GH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  if (options.includeTime) {
    const timeStr = target.toLocaleTimeString("en-GH", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateStr} at ${timeStr}`;
  }

  return dateStr;
}

/**
 * Format a phone number for display
 */
export function formatPhoneDisplay(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");
  
  // Ghana phone format: +233 XX XXX XXXX
  if (digits.startsWith("233") && digits.length === 12) {
    return `+233 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  
  // Local format: 0XX XXX XXXX
  if (digits.length === 10 && digits.startsWith("0")) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  
  return phone;
}

/**
 * Format verification level for display
 */
export function formatVerificationLevel(level: string): string {
  const levels: Record<string, string> = {
    LEVEL_0_UNVERIFIED: "Unverified",
    LEVEL_1_DOCS_UPLOADED: "Documents Uploaded",
    LEVEL_2_PLATFORM_REVIEWED: "Platform Verified",
    LEVEL_3_OFFICIAL_VERIFIED: "Officially Verified",
  };
  return levels[level] || level;
}

/**
 * Format listing status for display
 */
export function formatListingStatus(status: string): string {
  const statuses: Record<string, string> = {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    UNDER_REVIEW: "Under Review",
    PUBLISHED: "Published",
    SUSPENDED: "Suspended",
    REJECTED: "Rejected",
    ARCHIVED: "Archived",
    SOLD: "Sold",
  };
  return statuses[status] || status;
}

/**
 * Format transaction status for display
 */
export function formatTransactionStatus(status: string): string {
  const statuses: Record<string, string> = {
    CREATED: "Created",
    ESCROW_REQUESTED: "Escrow Requested",
    FUNDED: "Funded",
    VERIFICATION_PERIOD: "Verification Period",
    DISPUTED: "Disputed",
    READY_TO_RELEASE: "Ready to Release",
    RELEASED: "Released",
    REFUNDED: "Refunded",
    PARTIAL_SETTLED: "Partially Settled",
    CLOSED: "Closed",
  };
  return statuses[status] || status;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

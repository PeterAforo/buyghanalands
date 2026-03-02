// API-related types

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: unknown;
  statusCode: number;
}

export interface HealthCheckResponse {
  status: "healthy" | "degraded";
  timestamp: string;
  version: string;
  uptime: number;
  latency: number;
  checks: Record<
    string,
    {
      status: "ok" | "error";
      latency?: number;
      error?: string;
    }
  >;
}

export interface DeepLinkResolution {
  type: string;
  screen: string;
  params: Record<string, string>;
  resource?: unknown;
  originalPath?: string;
}

export interface DeviceRegistration {
  token: string;
  platform: "IOS" | "ANDROID" | "WEB";
  deviceName?: string;
  appVersion?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}

// Ghana-specific types
export type GhanaRegion =
  | "Greater Accra"
  | "Ashanti"
  | "Western"
  | "Eastern"
  | "Central"
  | "Northern"
  | "Volta"
  | "Upper East"
  | "Upper West"
  | "Bono"
  | "Bono East"
  | "Ahafo"
  | "Western North"
  | "Oti"
  | "North East"
  | "Savannah";

export const GHANA_REGIONS: GhanaRegion[] = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Eastern",
  "Central",
  "Northern",
  "Volta",
  "Upper East",
  "Upper West",
  "Bono",
  "Bono East",
  "Ahafo",
  "Western North",
  "Oti",
  "North East",
  "Savannah",
];

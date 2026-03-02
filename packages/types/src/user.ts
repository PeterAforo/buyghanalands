// User-related types

export type UserRole =
  | "BUYER"
  | "SELLER"
  | "AGENT"
  | "PROFESSIONAL"
  | "ADMIN"
  | "SUPPORT"
  | "COMPLIANCE"
  | "FINANCE"
  | "MODERATOR";

export type KycTier = "TIER_0_OTP" | "TIER_1_ID_UPLOAD" | "TIER_2_GHANA_CARD";

export type AccountStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

export interface User {
  id: string;
  email: string | null;
  emailVerified: boolean;
  phone: string;
  phoneVerified: boolean;
  fullName: string;
  avatarUrl: string | null;
  roles: UserRole[];
  kycTier: KycTier;
  accountStatus: AccountStatus;
  language: string;
  marketingOptIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string | null;
  phone: string;
  fullName: string;
  avatarUrl: string | null;
  roles: UserRole[];
  kycTier: KycTier;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}

export interface AuthResponse extends AuthTokens {
  user: UserProfile;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface OtpLoginRequest {
  phone: string;
  otp: string;
}

export interface RegisterRequest {
  phone: string;
  fullName: string;
  password: string;
  email?: string;
}

export interface AppleAuthRequest {
  identityToken: string;
  authorizationCode: string;
  user?: {
    email?: string;
    fullName?: {
      givenName?: string;
      familyName?: string;
    };
  };
  nonce?: string;
}

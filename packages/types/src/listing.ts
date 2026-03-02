// Listing-related types

export type ListingStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "PUBLISHED"
  | "SUSPENDED"
  | "REJECTED"
  | "ARCHIVED"
  | "SOLD";

export type ListingTenureType = "FREEHOLD" | "LEASEHOLD" | "CUSTOMARY";

export type ListingLandType =
  | "RESIDENTIAL"
  | "COMMERCIAL"
  | "INDUSTRIAL"
  | "AGRICULTURAL"
  | "MIXED";

export type VerificationLevel =
  | "LEVEL_0_UNVERIFIED"
  | "LEVEL_1_DOCS_UPLOADED"
  | "LEVEL_2_PLATFORM_REVIEWED"
  | "LEVEL_3_OFFICIAL_VERIFIED";

export interface ListingMedia {
  id: string;
  type: "PHOTO" | "VIDEO";
  url: string;
  sortOrder: number;
}

export interface ListingLocation {
  region: string;
  district: string;
  constituency: string | null;
  town: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface Listing {
  id: string;
  sellerId: string;
  status: ListingStatus;
  title: string;
  description: string;
  location: ListingLocation;
  landType: ListingLandType;
  tenureType: ListingTenureType;
  leaseDurationYears: number | null;
  sizeAcres: number;
  totalPlots: number;
  availablePlots: number;
  priceGhs: number;
  pricePerPlotGhs: number | null;
  negotiable: boolean;
  verificationLevel: VerificationLevel;
  media: ListingMedia[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface ListingCard {
  id: string;
  title: string;
  region: string;
  district: string;
  landType: ListingLandType;
  sizeAcres: number;
  priceGhs: number;
  verificationLevel: VerificationLevel;
  imageUrl: string | null;
  isFavorite?: boolean;
}

export interface ListingFilters {
  query?: string;
  region?: string;
  district?: string;
  landType?: ListingLandType;
  tenureType?: ListingTenureType;
  minPrice?: number;
  maxPrice?: number;
  minSize?: number;
  maxSize?: number;
  verifiedOnly?: boolean;
  sortBy?: "price_asc" | "price_desc" | "date_desc" | "size_asc" | "size_desc";
  page?: number;
  limit?: number;
}

export interface ListingSearchResult {
  listings: ListingCard[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateListingRequest {
  title: string;
  description: string;
  region: string;
  district: string;
  constituency?: string;
  town?: string;
  latitude?: number;
  longitude?: number;
  landType: ListingLandType;
  tenureType: ListingTenureType;
  leaseDurationYears?: number;
  sizeAcres: number;
  totalPlots?: number;
  priceGhs: number;
  pricePerPlotGhs?: number;
  negotiable?: boolean;
}

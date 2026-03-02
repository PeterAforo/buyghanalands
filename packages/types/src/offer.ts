// Offer-related types

export type OfferStatus =
  | "SENT"
  | "COUNTERED"
  | "ACCEPTED"
  | "EXPIRED"
  | "WITHDRAWN";

export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  amountGhs: number;
  message: string | null;
  status: OfferStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfferWithDetails extends Offer {
  listing: {
    id: string;
    title: string;
    priceGhs: number;
    imageUrl: string | null;
  };
  buyer: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export interface CreateOfferRequest {
  listingId: string;
  amountGhs: number;
  message?: string;
}

export interface CounterOfferRequest {
  amountGhs: number;
  message?: string;
}

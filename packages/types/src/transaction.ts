// Transaction-related types

export type TransactionStatus =
  | "CREATED"
  | "ESCROW_REQUESTED"
  | "FUNDED"
  | "VERIFICATION_PERIOD"
  | "DISPUTED"
  | "READY_TO_RELEASE"
  | "RELEASED"
  | "REFUNDED"
  | "PARTIAL_SETTLED"
  | "CLOSED";

export type PaymentProvider =
  | "FLUTTERWAVE"
  | "PAYSTACK"
  | "HUBTEL"
  | "BANK_TRANSFER"
  | "OTHER";

export type PaymentStatus =
  | "INITIATED"
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED";

export type PaymentType =
  | "LISTING_FEE"
  | "TRANSACTION_FUNDING"
  | "PAYOUT"
  | "REFUND"
  | "ESCROW_RELEASE"
  | "SERVICE_FEE";

export interface Transaction {
  id: string;
  listingId: string;
  offerId: string;
  buyerId: string;
  sellerId: string;
  agreedPriceGhs: number;
  platformFeeBps: number;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionWithDetails extends Transaction {
  listing: {
    id: string;
    title: string;
    imageUrl: string | null;
  };
  buyer: {
    id: string;
    fullName: string;
  };
  seller: {
    id: string;
    fullName: string;
  };
}

export interface Payment {
  id: string;
  listingId: string | null;
  transactionId: string | null;
  provider: PaymentProvider;
  type: PaymentType;
  status: PaymentStatus;
  currency: string;
  amount: number;
  providerRef: string | null;
  createdAt: string;
}

export interface InitiatePaymentRequest {
  listingId: string;
  amount: number;
  type: "ESCROW_DEPOSIT" | "FULL_PAYMENT" | "LISTING_FEE";
  transactionId?: string;
}

export interface PaymentResponse {
  paymentId: string;
  paymentUrl: string;
  reference: string;
}

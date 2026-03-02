// Notification-related types

export type NotificationType =
  | "NEW_OFFER"
  | "OFFER_ACCEPTED"
  | "OFFER_REJECTED"
  | "OFFER_COUNTERED"
  | "NEW_MESSAGE"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_FAILED"
  | "LISTING_APPROVED"
  | "LISTING_REJECTED"
  | "VERIFICATION_UPDATE"
  | "SAVED_SEARCH_MATCH"
  | "TRANSACTION_UPDATE"
  | "TRANSACTION_MILESTONE"
  | "DISPUTE_UPDATE"
  | "KYC_UPDATE";

export interface PushNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string> | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  newOffers: boolean;
  offerUpdates: boolean;
  messages: boolean;
  transactionAlerts: boolean;
  listingUpdates: boolean;
  verificationAlerts: boolean;
  savedSearchAlerts: boolean;
  marketingEmails: boolean;
}

export interface NotificationListResponse {
  notifications: PushNotification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data: {
    type: NotificationType;
    resourceId?: string;
    deepLink?: string;
    action?: string;
  };
  badge?: number;
  sound?: string;
  image?: string;
}

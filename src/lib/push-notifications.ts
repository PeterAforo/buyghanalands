import { prisma } from "./db";

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

export interface PushNotificationPayload {
  title: string;
  body: string;
  type: NotificationType;
  resourceId?: string;
  deepLink?: string;
  data?: Record<string, string>;
  image?: string;
}

interface FCMMessage {
  token: string;
  notification: {
    title: string;
    body: string;
    image?: string;
  };
  data: Record<string, string>;
  apns?: {
    payload: {
      aps: {
        badge?: number;
        sound?: string;
      };
    };
  };
  android?: {
    priority: "high" | "normal";
    notification: {
      channelId: string;
      sound?: string;
    };
  };
}

async function sendToFCM(messages: FCMMessage[]): Promise<void> {
  const fcmServerKey = process.env.FCM_SERVER_KEY;
  
  if (!fcmServerKey) {
    console.warn("FCM_SERVER_KEY not configured, skipping push notification");
    return;
  }

  // Using FCM HTTP v1 API
  // In production, use firebase-admin SDK for better reliability
  for (const message of messages) {
    try {
      const response = await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `key=${fcmServerKey}`,
        },
        body: JSON.stringify({
          to: message.token,
          notification: message.notification,
          data: message.data,
          priority: "high",
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("FCM send error:", error);
      }
    } catch (error) {
      console.error("FCM request error:", error);
    }
  }
}

export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ sent: number; stored: boolean }> {
  // Get user's device tokens
  const deviceTokens = await prisma.deviceToken.findMany({
    where: {
      userId,
      isActive: true,
    },
    select: {
      token: true,
      platform: true,
    },
  });

  // Check user's notification preferences
  const preferences = await prisma.notificationPreferences.findUnique({
    where: { userId },
  });

  // Map notification type to preference field
  const shouldSend = checkNotificationPreference(payload.type, preferences);

  if (!shouldSend) {
    return { sent: 0, stored: false };
  }

  // Store notification in database
  await prisma.pushNotification.create({
    data: {
      userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: {
        resourceId: payload.resourceId,
        deepLink: payload.deepLink,
        ...payload.data,
      },
    },
  });

  // Send to FCM if we have device tokens
  if (deviceTokens.length > 0) {
    const messages: FCMMessage[] = deviceTokens.map((device) => ({
      token: device.token,
      notification: {
        title: payload.title,
        body: payload.body,
        image: payload.image,
      },
      data: {
        type: payload.type,
        resourceId: payload.resourceId || "",
        deepLink: payload.deepLink || "",
        ...payload.data,
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: "default",
          },
        },
      },
      android: {
        priority: "high",
        notification: {
          channelId: getAndroidChannel(payload.type),
          sound: "default",
        },
      },
    }));

    await sendToFCM(messages);
  }

  return { sent: deviceTokens.length, stored: true };
}

export async function sendBulkPushNotification(
  userIds: string[],
  payload: PushNotificationPayload
): Promise<{ totalSent: number; totalStored: number }> {
  let totalSent = 0;
  let totalStored = 0;

  for (const userId of userIds) {
    const result = await sendPushNotification(userId, payload);
    totalSent += result.sent;
    if (result.stored) totalStored++;
  }

  return { totalSent, totalStored };
}

function checkNotificationPreference(
  type: NotificationType,
  preferences: {
    newOffers: boolean;
    offerUpdates: boolean;
    messages: boolean;
    transactionAlerts: boolean;
    listingUpdates: boolean;
    verificationAlerts: boolean;
    savedSearchAlerts: boolean;
    marketingEmails: boolean;
  } | null
): boolean {
  // Default to true if no preferences set
  if (!preferences) return true;

  switch (type) {
    case "NEW_OFFER":
      return preferences.newOffers;
    case "OFFER_ACCEPTED":
    case "OFFER_REJECTED":
    case "OFFER_COUNTERED":
      return preferences.offerUpdates;
    case "NEW_MESSAGE":
      return preferences.messages;
    case "PAYMENT_RECEIVED":
    case "PAYMENT_FAILED":
    case "TRANSACTION_UPDATE":
    case "TRANSACTION_MILESTONE":
      return preferences.transactionAlerts;
    case "LISTING_APPROVED":
    case "LISTING_REJECTED":
      return preferences.listingUpdates;
    case "VERIFICATION_UPDATE":
    case "KYC_UPDATE":
      return preferences.verificationAlerts;
    case "SAVED_SEARCH_MATCH":
      return preferences.savedSearchAlerts;
    case "DISPUTE_UPDATE":
      return preferences.transactionAlerts;
    default:
      return true;
  }
}

function getAndroidChannel(type: NotificationType): string {
  switch (type) {
    case "NEW_MESSAGE":
      return "messages";
    case "NEW_OFFER":
    case "OFFER_ACCEPTED":
    case "OFFER_REJECTED":
    case "OFFER_COUNTERED":
      return "offers";
    case "PAYMENT_RECEIVED":
    case "PAYMENT_FAILED":
    case "TRANSACTION_UPDATE":
    case "TRANSACTION_MILESTONE":
      return "transactions";
    case "LISTING_APPROVED":
    case "LISTING_REJECTED":
      return "listings";
    case "VERIFICATION_UPDATE":
    case "KYC_UPDATE":
      return "verification";
    case "SAVED_SEARCH_MATCH":
      return "alerts";
    case "DISPUTE_UPDATE":
      return "disputes";
    default:
      return "default";
  }
}

// Notification templates
export const notificationTemplates = {
  newOffer: (listingTitle: string, amount: string) => ({
    title: "New Offer Received",
    body: `You received an offer of ${amount} for "${listingTitle}"`,
    type: "NEW_OFFER" as NotificationType,
  }),

  offerAccepted: (listingTitle: string) => ({
    title: "Offer Accepted!",
    body: `Your offer for "${listingTitle}" has been accepted`,
    type: "OFFER_ACCEPTED" as NotificationType,
  }),

  offerRejected: (listingTitle: string) => ({
    title: "Offer Declined",
    body: `Your offer for "${listingTitle}" was not accepted`,
    type: "OFFER_REJECTED" as NotificationType,
  }),

  newMessage: (senderName: string) => ({
    title: "New Message",
    body: `${senderName} sent you a message`,
    type: "NEW_MESSAGE" as NotificationType,
  }),

  paymentReceived: (amount: string) => ({
    title: "Payment Received",
    body: `You received a payment of ${amount}`,
    type: "PAYMENT_RECEIVED" as NotificationType,
  }),

  listingApproved: (listingTitle: string) => ({
    title: "Listing Approved",
    body: `Your listing "${listingTitle}" is now live`,
    type: "LISTING_APPROVED" as NotificationType,
  }),

  savedSearchMatch: (searchName: string, count: number) => ({
    title: "New Matches Found",
    body: `${count} new listing${count > 1 ? "s" : ""} match your saved search "${searchName}"`,
    type: "SAVED_SEARCH_MATCH" as NotificationType,
  }),

  transactionUpdate: (status: string) => ({
    title: "Transaction Update",
    body: `Your transaction status changed to: ${status}`,
    type: "TRANSACTION_UPDATE" as NotificationType,
  }),

  verificationUpdate: (status: string) => ({
    title: "Verification Update",
    body: `Your verification request is now: ${status}`,
    type: "VERIFICATION_UPDATE" as NotificationType,
  }),
};

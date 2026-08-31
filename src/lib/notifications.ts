import { sendEmail, getOfferNotificationEmailHtml, getWelcomeEmailHtml, getNewMessageEmailHtml } from "./email";
import { sendSMS } from "./sms";
import { prisma, withDbRetry } from "./db";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface NotificationOptions {
  userId: string;
  type: "email" | "sms" | "both";
  subject?: string;
  emailHtml?: string;
  smsMessage?: string;
}

export async function sendNotification(options: NotificationOptions): Promise<void> {
  const user = await withDbRetry(() => prisma.user.findUnique({
    where: { id: options.userId },
    select: { email: true, phone: true, fullName: true },
  }));

  if (!user) {
    console.error("User not found for notification:", options.userId);
    return;
  }

  const promises: Promise<any>[] = [];

  if ((options.type === "email" || options.type === "both") && user.email && options.emailHtml && options.subject) {
    promises.push(
      sendEmail({
        to: user.email,
        subject: options.subject,
        html: options.emailHtml,
      })
    );
  }

  if ((options.type === "sms" || options.type === "both") && user.phone && options.smsMessage) {
    promises.push(sendSMS(user.phone, options.smsMessage));
  }

  await Promise.allSettled(promises);
}

// Offer Notifications
export async function notifyOfferReceived(sellerId: string, listingTitle: string, amount: number): Promise<void> {
  await sendNotification({
    userId: sellerId,
    type: "both",
    subject: "New Offer Received - BuyGhanaLands",
    emailHtml: getOfferNotificationEmailHtml("received", listingTitle, amount),
    smsMessage: `BuyGhanaLands: New offer of GH₵${amount.toLocaleString()} received for "${listingTitle}". Login to respond.`,
  });
}

export async function notifyOfferAccepted(buyerId: string, listingTitle: string, amount: number): Promise<void> {
  await sendNotification({
    userId: buyerId,
    type: "both",
    subject: "Your Offer Was Accepted! - BuyGhanaLands",
    emailHtml: getOfferNotificationEmailHtml("accepted", listingTitle, amount),
    smsMessage: `BuyGhanaLands: Great news! Your offer of GH₵${amount.toLocaleString()} for "${listingTitle}" was accepted. Login to proceed with payment.`,
  });
}

export async function notifyOfferCountered(buyerId: string, listingTitle: string, amount: number): Promise<void> {
  await sendNotification({
    userId: buyerId,
    type: "both",
    subject: "Counter Offer Received - BuyGhanaLands",
    emailHtml: getOfferNotificationEmailHtml("countered", listingTitle, amount),
    smsMessage: `BuyGhanaLands: Counter offer of GH₵${amount.toLocaleString()} received for "${listingTitle}". Login to respond.`,
  });
}

// Transaction Notifications
export async function notifyTransactionFunded(sellerId: string, listingTitle: string, amount: number): Promise<void> {
  const emailHtml = getTransactionEmailHtml("funded", listingTitle, amount);
  await sendNotification({
    userId: sellerId,
    type: "both",
    subject: "Escrow Funded - BuyGhanaLands",
    emailHtml,
    smsMessage: `BuyGhanaLands: Buyer has funded escrow with GH₵${amount.toLocaleString()} for "${listingTitle}". Verification period has started.`,
  });
}

export async function notifyTransactionDisputed(sellerId: string, listingTitle: string): Promise<void> {
  const emailHtml = getTransactionEmailHtml("disputed", listingTitle, 0);
  await sendNotification({
    userId: sellerId,
    type: "both",
    subject: "Dispute Raised - BuyGhanaLands",
    emailHtml,
    smsMessage: `BuyGhanaLands: A dispute has been raised for "${listingTitle}". Our team will review and contact you.`,
  });
}

export async function notifyTransactionReleased(sellerId: string, listingTitle: string, amount: number): Promise<void> {
  const emailHtml = getTransactionEmailHtml("released", listingTitle, amount);
  await sendNotification({
    userId: sellerId,
    type: "both",
    subject: "Funds Released - BuyGhanaLands",
    emailHtml,
    smsMessage: `BuyGhanaLands: GH₵${amount.toLocaleString()} has been released to your account for "${listingTitle}". Thank you for using BuyGhanaLands!`,
  });
}

export async function notifyDisputeResolved(userId: string, listingTitle: string, outcome: string): Promise<void> {
  const outcomeText = outcome === "RELEASE" ? "funds released to seller" :
                      outcome === "REFUND" ? "full refund to buyer" :
                      outcome === "PARTIAL" ? "partial settlement" : "transaction terminated";
  
  await sendNotification({
    userId,
    type: "both",
    subject: "Dispute Resolved - BuyGhanaLands",
    emailHtml: getTransactionEmailHtml("resolved", listingTitle, 0, `Outcome: ${outcomeText}`),
    smsMessage: `BuyGhanaLands: Your dispute for "${listingTitle}" has been resolved. ${outcomeText}. Login for details.`,
  });
}

export async function notifyTransactionRefunded(buyerId: string, listingTitle: string, amount: number): Promise<void> {
  const emailHtml = getTransactionEmailHtml("refunded", listingTitle, amount);
  await sendNotification({
    userId: buyerId,
    type: "both",
    subject: "Refund Processed - BuyGhanaLands",
    emailHtml,
    smsMessage: `BuyGhanaLands: GH₵${amount.toLocaleString()} has been refunded for "${listingTitle}".`,
  });
}

// Welcome Notification
export async function notifyWelcome(userId: string, name: string): Promise<void> {
  await sendNotification({
    userId,
    type: "both",
    subject: "Welcome to BuyGhanaLands!",
    emailHtml: getWelcomeEmailHtml(name),
    smsMessage: `Welcome to BuyGhanaLands, ${name}! Ghana's trusted land marketplace. Start browsing verified listings today.`,
  });
}

// New Message Notification
export async function notifyNewMessage(receiverId: string, senderName: string, messagePreview: string, listingTitle?: string): Promise<void> {
  await sendNotification({
    userId: receiverId,
    type: "both",
    subject: `New message from ${senderName} - BuyGhanaLands`,
    emailHtml: getNewMessageEmailHtml(senderName, messagePreview, listingTitle),
    smsMessage: `BuyGhanaLands: New message from ${senderName}${listingTitle ? ` about "${listingTitle}"` : ""}. Login to reply.`,
  });
}

// Transaction Email Template
function getTransactionEmailHtml(type: "funded" | "disputed" | "released" | "refunded" | "resolved", listingTitle: string, amount: number, extraMessage?: string): string {
  const config = {
    funded: {
      title: "Escrow Funded",
      message: `The buyer has funded the escrow with GH₵${amount.toLocaleString()} for "${listingTitle}". The verification period has now started.`,
      color: "#059669",
    },
    disputed: {
      title: "Dispute Raised",
      message: `A dispute has been raised for the transaction on "${listingTitle}". Our team will review the case and contact both parties.`,
      color: "#dc2626",
    },
    released: {
      title: "Funds Released!",
      message: `Congratulations! GH₵${amount.toLocaleString()} has been released to your account for the sale of "${listingTitle}".`,
      color: "#059669",
    },
    refunded: {
      title: "Refund Processed",
      message: `GH₵${amount.toLocaleString()} has been refunded to your account for "${listingTitle}".`,
      color: "#6b7280",
    },
    resolved: {
      title: "Dispute Resolved",
      message: `Your dispute for "${listingTitle}" has been resolved. ${extraMessage || ""}`,
      color: "#2563eb",
    },
  };

  const { title, message, color } = config[type];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${color}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .highlight { background: white; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 15px 0; }
        .amount { font-size: 24px; font-weight: bold; color: ${color}; text-align: center; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          <p>${message}</p>
          ${amount > 0 ? `<div class="highlight"><p class="amount">GH₵${amount.toLocaleString()}</p></div>` : ""}
          <p><a href="${APP_URL}/dashboard/transactions" class="button">View Transaction</a></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} BuyGhanaLands. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ---------------------------------------------------------------------------
// Generic Notification Email Template
// ---------------------------------------------------------------------------

interface GenericEmailConfig {
  title: string;
  message: string;
  color: string;
  buttonText?: string;
  buttonUrl?: string;
  extraHtml?: string;
}

function getGenericNotificationEmailHtml(config: GenericEmailConfig): string {
  const { title, message, color, buttonText, buttonUrl, extraHtml } = config;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${color}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .highlight { background: white; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 15px 0; }
        .amount { font-size: 24px; font-weight: bold; color: ${color}; text-align: center; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
        .notes { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          <p>${message}</p>
          ${extraHtml || ""}
          ${buttonText && buttonUrl ? `<p><a href="${buttonUrl}" class="button">${buttonText}</a></p>` : ""}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} BuyGhanaLands. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ---------------------------------------------------------------------------
// Listing Moderation Notification
// ---------------------------------------------------------------------------

export async function notifyListingModerated(
  sellerId: string,
  listingTitle: string,
  decision: "approved" | "rejected" | "suspended",
  reason?: string
): Promise<void> {
  const config = {
    approved: {
      title: "Listing Approved!",
      message: `Great news! Your listing "${listingTitle}" has been approved and is now live on BuyGhanaLands.`,
      color: "#059669",
      buttonText: "View Listing",
      buttonUrl: `${APP_URL}/dashboard/listings`,
    },
    rejected: {
      title: "Listing Rejected",
      message: `Your listing "${listingTitle}" was not approved by our moderation team.`,
      color: "#dc2626",
      buttonText: "View Listing",
      buttonUrl: `${APP_URL}/dashboard/listings`,
    },
    suspended: {
      title: "Listing Suspended",
      message: `Your listing "${listingTitle}" has been suspended pending further review.`,
      color: "#b45309",
      buttonText: "View Listing",
      buttonUrl: `${APP_URL}/dashboard/listings`,
    },
  };

  const c = config[decision];
  const extraHtml = reason
    ? `<div class="notes"><strong>Reason:</strong><br/>${reason}</div>`
    : "";

  await sendNotification({
    userId: sellerId,
    type: "both",
    subject: `${c.title} - BuyGhanaLands`,
    emailHtml: getGenericNotificationEmailHtml({
      title: c.title,
      message: c.message,
      color: c.color,
      buttonText: c.buttonText,
      buttonUrl: c.buttonUrl,
      extraHtml,
    }),
    smsMessage: `BuyGhanaLands: Your listing "${listingTitle}" was ${decision}.${reason ? ` Reason: ${reason}` : ""} Login to view.`,
  });
}

// ---------------------------------------------------------------------------
// Payout Notifications
// ---------------------------------------------------------------------------

export async function notifyPayoutProcessed(
  sellerId: string,
  listingTitle: string,
  amountGhs: number,
  providerRef: string
): Promise<void> {
  const title = "Payout Processed!";
  const message = `Your payout of GH₵${amountGhs.toLocaleString()} for the sale of "${listingTitle}" has been processed successfully.`;

  await sendNotification({
    userId: sellerId,
    type: "both",
    subject: "Payout Processed - BuyGhanaLands",
    emailHtml: getGenericNotificationEmailHtml({
      title,
      message,
      color: "#059669",
      buttonText: "View Transactions",
      buttonUrl: `${APP_URL}/dashboard/transactions`,
      extraHtml: `
        <div class="highlight"><p class="amount">GH₵${amountGhs.toLocaleString()}</p></div>
        <p><strong>Reference:</strong> ${providerRef}</p>
      `,
    }),
    smsMessage: `BuyGhanaLands: Payout of GH₵${amountGhs.toLocaleString()} for "${listingTitle}" processed. Ref: ${providerRef}.`,
  });
}

export async function notifyPayoutFailed(
  sellerId: string,
  listingTitle: string,
  errorMessage: string
): Promise<void> {
  const title = "Payout Failed";
  const message = `We were unable to process your payout for the sale of "${listingTitle}".`;

  await sendNotification({
    userId: sellerId,
    type: "both",
    subject: "Payout Failed - BuyGhanaLands",
    emailHtml: getGenericNotificationEmailHtml({
      title,
      message,
      color: "#dc2626",
      buttonText: "Contact Support",
      buttonUrl: `${APP_URL}/support`,
      extraHtml: `<div class="notes"><strong>Error:</strong><br/>${errorMessage}</div>`,
    }),
    smsMessage: `BuyGhanaLands: Payout for "${listingTitle}" failed. Error: ${errorMessage}. Please check your payout details.`,
  });
}

// ---------------------------------------------------------------------------
// KYC Notifications
// ---------------------------------------------------------------------------

export async function notifyKycApproved(userId: string, tier: string): Promise<void> {
  const title = "KYC Verification Approved!";
  const message = `Congratulations! Your identity verification has been approved. You are now at ${tier}.`;

  await sendNotification({
    userId,
    type: "both",
    subject: "KYC Approved - BuyGhanaLands",
    emailHtml: getGenericNotificationEmailHtml({
      title,
      message,
      color: "#059669",
      buttonText: "View Profile",
      buttonUrl: `${APP_URL}/dashboard/profile`,
    }),
    smsMessage: `BuyGhanaLands: Your KYC verification has been approved. You are now at ${tier}. You can now list land for sale.`,
  });
}

export async function notifyKycRejected(userId: string, reason: string): Promise<void> {
  const title = "KYC Verification Rejected";
  const message = `We were unable to approve your identity verification.`;

  await sendNotification({
    userId,
    type: "both",
    subject: "KYC Rejected - BuyGhanaLands",
    emailHtml: getGenericNotificationEmailHtml({
      title,
      message,
      color: "#dc2626",
      buttonText: "Update KYC",
      buttonUrl: `${APP_URL}/dashboard/kyc`,
      extraHtml: `<div class="notes"><strong>Reason:</strong><br/>${reason}</div>`,
    }),
    smsMessage: `BuyGhanaLands: Your KYC verification was rejected. Reason: ${reason}. Login to resubmit.`,
  });
}

export async function notifyKycRetryRequested(userId: string, issues: string[]): Promise<void> {
  const title = "KYC Action Required";
  const message = `Please review and resubmit your identity verification. The following issues were found:`;
  const issuesHtml = `<ul>${issues.map((i) => `<li>${i}</li>`).join("")}</ul>`;

  await sendNotification({
    userId,
    type: "both",
    subject: "KYC Resubmission Required - BuyGhanaLands",
    emailHtml: getGenericNotificationEmailHtml({
      title,
      message,
      color: "#b45309",
      buttonText: "Resubmit KYC",
      buttonUrl: `${APP_URL}/dashboard/kyc`,
      extraHtml: `<div class="notes">${issuesHtml}</div>`,
    }),
    smsMessage: `BuyGhanaLands: Please resubmit your KYC. Issues: ${issues.join("; ")}. Login to update.`,
  });
}

// ---------------------------------------------------------------------------
// Subscription Expiring Notification
// ---------------------------------------------------------------------------

export async function notifySubscriptionExpiring(
  userId: string,
  planName: string,
  daysLeft: number
): Promise<void> {
  const title = "Subscription Expiring Soon";
  const message =
    daysLeft <= 0
      ? `Your ${planName} subscription has expired. Renew now to keep your Pro features active.`
      : `Your ${planName} subscription expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Renew now to avoid losing your Pro features.`;

  await sendNotification({
    userId,
    type: "both",
    subject: "Subscription Expiring - BuyGhanaLands",
    emailHtml: getGenericNotificationEmailHtml({
      title,
      message,
      color: "#b45309",
      buttonText: "Renew Subscription",
      buttonUrl: `${APP_URL}/dashboard/subscription`,
    }),
    smsMessage: `BuyGhanaLands: Your ${planName} subscription ${daysLeft <= 0 ? "has expired" : `expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}. Renew now to keep Pro features.`,
  });
}

// ---------------------------------------------------------------------------
// Newsletter Welcome (no user account — direct email only)
// ---------------------------------------------------------------------------

export async function notifyNewsletterWelcome(email: string): Promise<void> {
  const html = getGenericNotificationEmailHtml({
    title: "Welcome to the BuyGhanaLands Newsletter!",
    message:
      "Thanks for subscribing! You'll now receive updates about new land listings, market trends, and exclusive offers across Ghana.",
    color: "#059669",
    buttonText: "Browse Listings",
    buttonUrl: `${APP_URL}/listings`,
  });

  await sendEmail({
    to: email,
    subject: "Welcome to the BuyGhanaLands Newsletter!",
    html,
    text: "Thanks for subscribing to the BuyGhanaLands newsletter! You'll now receive updates about new land listings, market trends, and exclusive offers across Ghana.",
  });
}

import { sendEmail, getOfferNotificationEmailHtml, getWelcomeEmailHtml, getNewMessageEmailHtml } from "./email";
import { sendSMS } from "./sms";
import { prisma } from "./db";

interface NotificationOptions {
  userId: string;
  type: "email" | "sms" | "both";
  subject?: string;
  emailHtml?: string;
  smsMessage?: string;
}

export async function sendNotification(options: NotificationOptions): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: options.userId },
    select: { email: true, phone: true, fullName: true },
  });

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
    subject: "Funds Released! - BuyGhanaLands",
    emailHtml,
    smsMessage: `BuyGhanaLands: GH₵${amount.toLocaleString()} has been released to your account for "${listingTitle}". Congratulations!`,
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
function getTransactionEmailHtml(type: "funded" | "disputed" | "released" | "refunded", listingTitle: string, amount: number): string {
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
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/transactions" class="button">View Transaction</a></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} BuyGhanaLands. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

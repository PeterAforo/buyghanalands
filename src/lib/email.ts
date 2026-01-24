import nodemailer from 'nodemailer';

// SMTP Configuration - uses environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@buyghanalands.com";
const FROM_NAME = process.env.FROM_NAME || "BuyGhanaLands";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log("Email sent:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to send email" };
  }
}

// Email templates
export function getWelcomeEmailHtml(name: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to BuyGhanaLands!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Thank you for joining BuyGhanaLands, Ghana's trusted land marketplace.</p>
          <p>You can now:</p>
          <ul>
            <li>Browse verified land listings across Ghana</li>
            <li>List your own land for sale</li>
            <li>Connect with verified sellers and buyers</li>
            <li>Access professional services for land transactions</li>
          </ul>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/listings" class="button">Browse Listings</a></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} BuyGhanaLands. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getNewMessageEmailHtml(senderName: string, messagePreview: string, listingTitle?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .message-box { background: white; padding: 15px; border-left: 4px solid #059669; margin: 15px 0; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Message</h1>
        </div>
        <div class="content">
          <p>You have a new message from <strong>${senderName}</strong>${listingTitle ? ` regarding "${listingTitle}"` : ""}:</p>
          <div class="message-box">
            <p>${messagePreview}</p>
          </div>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/messages" class="button">View Message</a></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} BuyGhanaLands. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getOfferNotificationEmailHtml(type: "received" | "accepted" | "countered", listingTitle: string, amount: number): string {
  const titles = {
    received: "New Offer Received",
    accepted: "Your Offer Was Accepted!",
    countered: "Counter Offer Received",
  };
  
  const messages = {
    received: `You have received a new offer of GH₵${amount.toLocaleString()} for your listing "${listingTitle}".`,
    accepted: `Great news! Your offer of GH₵${amount.toLocaleString()} for "${listingTitle}" has been accepted.`,
    countered: `The seller has countered your offer for "${listingTitle}" with a new price of GH₵${amount.toLocaleString()}.`,
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .highlight { background: white; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 15px 0; text-align: center; }
        .amount { font-size: 24px; font-weight: bold; color: #059669; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${titles[type]}</h1>
        </div>
        <div class="content">
          <p>${messages[type]}</p>
          <div class="highlight">
            <p class="amount">GH₵${amount.toLocaleString()}</p>
            <p>${listingTitle}</p>
          </div>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">View Details</a></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} BuyGhanaLands. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// New Listing Alert Email
export function getNewListingAlertEmailHtml(
  searchName: string,
  listings: { title: string; region: string; price: string; url: string }[]
): string {
  const listingsHtml = listings
    .map(
      (l) => `
      <div style="background: white; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 10px 0;">
        <h3 style="margin: 0 0 5px 0; color: #111827;">${l.title}</h3>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">${l.region}</p>
        <p style="margin: 5px 0 10px 0; font-size: 18px; font-weight: bold; color: #059669;">${l.price}</p>
        <a href="${l.url}" style="color: #059669; text-decoration: none; font-size: 14px;">View Listing →</a>
      </div>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Listings Match Your Search</h1>
        </div>
        <div class="content">
          <p>Great news! New listings match your saved search "<strong>${searchName}</strong>":</p>
          ${listingsHtml}
          <p style="margin-top: 20px;"><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/saved-searches" class="button">View All Matches</a></p>
        </div>
        <div class="footer">
          <p>You're receiving this because you enabled alerts for this search.</p>
          <p>© ${new Date().getFullYear()} BuyGhanaLands. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Payment Confirmation Email
export function getPaymentConfirmationEmailHtml(
  type: "success" | "failed",
  amount: number,
  listingTitle: string,
  transactionRef: string
): string {
  const isSuccess = type === "success";
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${isSuccess ? "#059669" : "#dc2626"}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .highlight { background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 15px 0; }
        .amount { font-size: 28px; font-weight: bold; color: ${isSuccess ? "#059669" : "#dc2626"}; text-align: center; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${isSuccess ? "Payment Successful!" : "Payment Failed"}</h1>
        </div>
        <div class="content">
          <p>${isSuccess ? "Your payment has been processed successfully." : "Unfortunately, your payment could not be processed."}</p>
          <div class="highlight">
            <p class="amount">GH₵${amount.toLocaleString()}</p>
            <div style="margin-top: 15px;">
              <p><strong>Listing:</strong> ${listingTitle}</p>
              <p><strong>Reference:</strong> ${transactionRef}</p>
              <p><strong>Status:</strong> ${isSuccess ? "Completed" : "Failed"}</p>
            </div>
          </div>
          ${isSuccess 
            ? `<p>Your funds are now held securely in escrow. The seller has been notified.</p>
               <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/transactions" class="button">View Transaction</a></p>`
            : `<p>Please try again or contact support if the issue persists.</p>
               <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/support" class="button">Contact Support</a></p>`
          }
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} BuyGhanaLands. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Document Verification Email
export function getVerificationStatusEmailHtml(
  status: "submitted" | "approved" | "rejected",
  listingTitle: string,
  notes?: string
): string {
  const config = {
    submitted: {
      title: "Verification Request Received",
      message: `We've received your verification request for "${listingTitle}". Our team will review your documents within 2-3 business days.`,
      color: "#2563eb",
    },
    approved: {
      title: "Verification Approved!",
      message: `Great news! Your listing "${listingTitle}" has been verified. Your listing now displays a verified badge.`,
      color: "#059669",
    },
    rejected: {
      title: "Verification Update Required",
      message: `We were unable to verify "${listingTitle}" with the provided documents.`,
      color: "#dc2626",
    },
  };

  const { title, message, color } = config[status];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${color}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .notes { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 15px 0; }
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
          ${notes ? `<div class="notes"><strong>Notes from reviewer:</strong><br/>${notes}</div>` : ""}
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/listings" class="button">View Listing</a></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} BuyGhanaLands. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Password Reset Email
export function getPasswordResetEmailHtml(name: string, resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .warning { color: #b45309; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p class="warning">This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} BuyGhanaLands. All rights reserved.</p>
          <p style="word-break: break-all; font-size: 11px;">If the button doesn't work: ${resetUrl}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendVerificationEmail(email: string, name: string, verificationUrl: string): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .warning { color: #b45309; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Thank you for registering with BuyGhanaLands! Please verify your email address by clicking the button below:</p>
          <p style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </p>
          <p class="warning">This link will expire in 24 hours.</p>
          <p>If you didn't create an account with BuyGhanaLands, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} BuyGhanaLands. All rights reserved.</p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; font-size: 11px;">${verificationUrl}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Verify your email - BuyGhanaLands",
    html,
    text: `Hi ${name}, Please verify your email by visiting: ${verificationUrl}. This link expires in 24 hours.`,
  });
}

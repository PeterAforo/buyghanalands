import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@buyghanalands.com";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn("Email service not configured (RESEND_API_KEY missing)");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error("Email send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: "Failed to send email" };
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

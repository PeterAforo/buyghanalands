import {
  sendNotification,
  notifyListingModerated,
  notifyPayoutProcessed,
  notifyKycApproved,
  notifyNewsletterWelcome,
  notifyOfferReceived,
  notifyOfferAccepted,
  notifyWelcome,
  notifyNewMessage,
  notifyKycRejected,
  notifyPayoutFailed,
} from '@/lib/notifications';

// Mock email module
jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
  getOfferNotificationEmailHtml: jest.fn().mockReturnValue('<html>offer</html>'),
  getWelcomeEmailHtml: jest.fn().mockReturnValue('<html>welcome</html>'),
  getNewMessageEmailHtml: jest.fn().mockReturnValue('<html>message</html>'),
}));

// Mock sms module
jest.mock('@/lib/sms', () => ({
  sendSMS: jest.fn().mockResolvedValue({ success: true, message: 'sent' }),
}));

// Mock db module
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
  withDbRetry: jest.fn(<T>(fn: () => Promise<T>) => fn()),
}));

import { sendEmail } from '@/lib/email';
import { sendSMS } from '@/lib/sms';
import { prisma } from '@/lib/db';

describe('Notifications Library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default user mock
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      email: 'user@example.com',
      phone: '0240000000',
      fullName: 'Test User',
    });
  });

  describe('sendNotification', () => {
    it('should send both email and SMS for type "both"', async () => {
      await sendNotification({
        userId: 'user1',
        type: 'both',
        subject: 'Test Subject',
        emailHtml: '<html>test</html>',
        smsMessage: 'Test SMS',
      });

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Test Subject',
          html: '<html>test</html>',
        })
      );
      expect(sendSMS).toHaveBeenCalledTimes(1);
      expect(sendSMS).toHaveBeenCalledWith('0240000000', 'Test SMS');
    });

    it('should send only email for type "email"', async () => {
      await sendNotification({
        userId: 'user1',
        type: 'email',
        subject: 'Test Subject',
        emailHtml: '<html>test</html>',
      });

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendSMS).not.toHaveBeenCalled();
    });

    it('should send only SMS for type "sms"', async () => {
      await sendNotification({
        userId: 'user1',
        type: 'sms',
        smsMessage: 'Test SMS',
      });

      expect(sendEmail).not.toHaveBeenCalled();
      expect(sendSMS).toHaveBeenCalledTimes(1);
    });

    it('should not send email if user has no email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        email: null,
        phone: '0240000000',
        fullName: 'Test User',
      });

      await sendNotification({
        userId: 'user1',
        type: 'both',
        subject: 'Test Subject',
        emailHtml: '<html>test</html>',
        smsMessage: 'Test SMS',
      });

      expect(sendEmail).not.toHaveBeenCalled();
      expect(sendSMS).toHaveBeenCalledTimes(1);
    });

    it('should not send anything if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await sendNotification({
        userId: 'nonexistent',
        type: 'both',
        subject: 'Test Subject',
        emailHtml: '<html>test</html>',
        smsMessage: 'Test SMS',
      });

      expect(sendEmail).not.toHaveBeenCalled();
      expect(sendSMS).not.toHaveBeenCalled();
    });
  });

  describe('notifyListingModerated', () => {
    it('should send notification for approved listing', async () => {
      await notifyListingModerated('seller1', 'My Land', 'approved');

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendSMS).toHaveBeenCalledTimes(1);
      const emailCall = (sendEmail as jest.Mock).mock.calls[0][0];
      expect(emailCall.subject).toContain('Listing Approved');
      expect(emailCall.html).toContain('My Land');
    });

    it('should send notification for rejected listing with reason', async () => {
      await notifyListingModerated('seller1', 'My Land', 'rejected', 'Invalid documents');

      expect(sendEmail).toHaveBeenCalledTimes(1);
      const emailCall = (sendEmail as jest.Mock).mock.calls[0][0];
      expect(emailCall.subject).toContain('Listing Rejected');
      expect(emailCall.html).toContain('Invalid documents');
    });

    it('should send notification for suspended listing', async () => {
      await notifyListingModerated('seller1', 'My Land', 'suspended');

      expect(sendEmail).toHaveBeenCalledTimes(1);
      const emailCall = (sendEmail as jest.Mock).mock.calls[0][0];
      expect(emailCall.subject).toContain('Listing Suspended');
    });
  });

  describe('notifyPayoutProcessed', () => {
    it('should send notification with amount and reference', async () => {
      await notifyPayoutProcessed('seller1', 'My Land', 5000, 'REF-12345');

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendSMS).toHaveBeenCalledTimes(1);
      const emailCall = (sendEmail as jest.Mock).mock.calls[0][0];
      expect(emailCall.subject).toContain('Payout Processed');
      expect(emailCall.html).toContain('5,000');
      expect(emailCall.html).toContain('REF-12345');
      const smsCall = (sendSMS as jest.Mock).mock.calls[0];
      expect(smsCall[1]).toContain('5,000');
      expect(smsCall[1]).toContain('REF-12345');
    });
  });

  describe('notifyPayoutFailed', () => {
    it('should send notification with error message', async () => {
      await notifyPayoutFailed('seller1', 'My Land', 'Bank account invalid');

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendSMS).toHaveBeenCalledTimes(1);
      const emailCall = (sendEmail as jest.Mock).mock.calls[0][0];
      expect(emailCall.subject).toContain('Payout Failed');
      expect(emailCall.html).toContain('Bank account invalid');
    });
  });

  describe('notifyKycApproved', () => {
    it('should send notification with tier info', async () => {
      await notifyKycApproved('user1', 'TIER_2_GHANA_CARD');

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendSMS).toHaveBeenCalledTimes(1);
      const emailCall = (sendEmail as jest.Mock).mock.calls[0][0];
      expect(emailCall.subject).toContain('KYC Approved');
      expect(emailCall.html).toContain('TIER_2_GHANA_CARD');
      const smsCall = (sendSMS as jest.Mock).mock.calls[0];
      expect(smsCall[1]).toContain('TIER_2_GHANA_CARD');
    });
  });

  describe('notifyKycRejected', () => {
    it('should send notification with rejection reason', async () => {
      await notifyKycRejected('user1', 'Blurry document');

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendSMS).toHaveBeenCalledTimes(1);
      const emailCall = (sendEmail as jest.Mock).mock.calls[0][0];
      expect(emailCall.subject).toContain('KYC Rejected');
      expect(emailCall.html).toContain('Blurry document');
    });
  });

  describe('notifyNewsletterWelcome', () => {
    it('should send email directly (no user lookup)', async () => {
      await notifyNewsletterWelcome('newsletter@example.com');

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendSMS).not.toHaveBeenCalled();
      const emailCall = (sendEmail as jest.Mock).mock.calls[0][0];
      expect(emailCall.to).toBe('newsletter@example.com');
      expect(emailCall.subject).toContain('Newsletter');
    });
  });

  describe('notifyOfferReceived', () => {
    it('should send notification to seller about new offer', async () => {
      await notifyOfferReceived('seller1', 'My Land', 10000);

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendSMS).toHaveBeenCalledTimes(1);
      const emailCall = (sendEmail as jest.Mock).mock.calls[0][0];
      expect(emailCall.subject).toContain('New Offer');
    });
  });

  describe('notifyOfferAccepted', () => {
    it('should send notification to buyer about accepted offer', async () => {
      await notifyOfferAccepted('buyer1', 'My Land', 10000);

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendSMS).toHaveBeenCalledTimes(1);
      const emailCall = (sendEmail as jest.Mock).mock.calls[0][0];
      expect(emailCall.subject).toContain('Accepted');
    });
  });

  describe('notifyWelcome', () => {
    it('should send welcome notification', async () => {
      await notifyWelcome('user1', 'John Doe');

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendSMS).toHaveBeenCalledTimes(1);
      const emailCall = (sendEmail as jest.Mock).mock.calls[0][0];
      expect(emailCall.subject).toContain('Welcome');
    });
  });

  describe('notifyNewMessage', () => {
    it('should send notification about new message', async () => {
      await notifyNewMessage('receiver1', 'Jane', 'Hello there', 'My Land');

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendSMS).toHaveBeenCalledTimes(1);
      const emailCall = (sendEmail as jest.Mock).mock.calls[0][0];
      expect(emailCall.subject).toContain('Jane');
    });
  });
});

import { 
  phoneSchema, 
  offerSchema, 
  disputeSchema, 
  messageSchema,
  createListingSchema,
  favoriteSchema,
  validateRequest 
} from '@/lib/validations';

describe('Validation Schemas', () => {
  describe('phoneSchema', () => {
    it('should accept valid phone numbers', () => {
      expect(() => phoneSchema.parse('0241234567')).not.toThrow();
      expect(() => phoneSchema.parse('+233241234567')).not.toThrow();
      expect(() => phoneSchema.parse('233241234567')).not.toThrow();
    });

    it('should reject invalid phone numbers', () => {
      expect(() => phoneSchema.parse('123')).toThrow();
      expect(() => phoneSchema.parse('abc1234567')).toThrow();
      expect(() => phoneSchema.parse('')).toThrow();
    });
  });

  describe('offerSchema', () => {
    it('should accept valid offer data', () => {
      const validOffer = {
        listingId: 'listing123',
        amountGhs: 50000,
        message: 'I am interested',
      };
      expect(() => offerSchema.parse(validOffer)).not.toThrow();
    });

    it('should reject offer with negative amount', () => {
      const invalidOffer = {
        listingId: 'listing123',
        amountGhs: -100,
      };
      expect(() => offerSchema.parse(invalidOffer)).toThrow();
    });

    it('should reject offer without listingId', () => {
      const invalidOffer = {
        amountGhs: 50000,
      };
      expect(() => offerSchema.parse(invalidOffer)).toThrow();
    });
  });

  describe('disputeSchema', () => {
    it('should accept valid dispute data', () => {
      const validDispute = {
        transactionId: 'trans123',
        summary: 'This is a detailed summary of the dispute',
      };
      expect(() => disputeSchema.parse(validDispute)).not.toThrow();
    });

    it('should reject dispute with short summary', () => {
      const invalidDispute = {
        transactionId: 'trans123',
        summary: 'Short',
      };
      expect(() => disputeSchema.parse(invalidDispute)).toThrow();
    });
  });

  describe('messageSchema', () => {
    it('should accept valid message data', () => {
      const validMessage = {
        receiverId: 'user123',
        body: 'Hello, I am interested in your listing',
      };
      expect(() => messageSchema.parse(validMessage)).not.toThrow();
    });

    it('should accept message with optional fields', () => {
      const validMessage = {
        receiverId: 'user123',
        body: 'Hello',
        listingId: 'listing123',
        transactionId: 'trans123',
      };
      expect(() => messageSchema.parse(validMessage)).not.toThrow();
    });

    it('should reject message without body', () => {
      const invalidMessage = {
        receiverId: 'user123',
      };
      expect(() => messageSchema.parse(invalidMessage)).toThrow();
    });
  });

  describe('createListingSchema', () => {
    const validListing = {
      title: 'Beautiful Land in Accra',
      description: 'This is a beautiful piece of land located in the heart of Accra.',
      region: 'Greater Accra',
      district: 'Accra Metropolitan',
      landType: 'RESIDENTIAL' as const,
      tenureType: 'FREEHOLD' as const,
      sizeAcres: 2.5,
      priceGhs: 500000,
    };

    it('should accept valid listing data', () => {
      expect(() => createListingSchema.parse(validListing)).not.toThrow();
    });

    it('should reject listing with short title', () => {
      const invalidListing = { ...validListing, title: 'Hi' };
      expect(() => createListingSchema.parse(invalidListing)).toThrow();
    });

    it('should reject listing with invalid land type', () => {
      const invalidListing = { ...validListing, landType: 'INVALID' };
      expect(() => createListingSchema.parse(invalidListing)).toThrow();
    });

    it('should reject listing with negative price', () => {
      const invalidListing = { ...validListing, priceGhs: -100 };
      expect(() => createListingSchema.parse(invalidListing)).toThrow();
    });
  });

  describe('favoriteSchema', () => {
    it('should accept valid favorite data', () => {
      expect(() => favoriteSchema.parse({ listingId: 'listing123' })).not.toThrow();
    });

    it('should reject empty listingId', () => {
      expect(() => favoriteSchema.parse({ listingId: '' })).toThrow();
    });
  });

  describe('validateRequest', () => {
    it('should return success with valid data', () => {
      const result = validateRequest(favoriteSchema, { listingId: 'test123' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.listingId).toBe('test123');
      }
    });

    it('should return error response with invalid data', () => {
      const result = validateRequest(favoriteSchema, { listingId: '' });
      expect(result.success).toBe(false);
    });
  });
});

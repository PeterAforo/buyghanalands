import { cn, formatPrice, formatDate, formatPhoneNumber, slugify, truncate, generateOTP } from '@/lib/utils';

describe('Utils Library', () => {
  describe('cn (className merge)', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('should merge tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });

    it('should handle arrays', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('should handle objects', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
    });
  });

  describe('formatPrice', () => {
    it('should format number as GHS currency', () => {
      const result = formatPrice(1000);
      expect(result).toContain('1,000');
      expect(result).toContain('GH');
    });

    it('should format bigint as GHS currency', () => {
      const result = formatPrice(BigInt(5000));
      expect(result).toContain('5,000');
    });

    it('should format string as GHS currency', () => {
      const result = formatPrice('2500.50');
      expect(result).toContain('2,500');
    });

    it('should handle zero', () => {
      const result = formatPrice(0);
      expect(result).toContain('0');
    });

    it('should handle large numbers', () => {
      const result = formatPrice(1000000);
      expect(result).toContain('1,000,000');
    });
  });

  describe('formatDate', () => {
    it('should format Date object', () => {
      const date = new Date('2024-03-15');
      const result = formatDate(date);
      expect(result).toContain('Mar');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should format date string', () => {
      const result = formatDate('2024-06-20');
      expect(result).toContain('Jun');
      expect(result).toContain('20');
      expect(result).toContain('2024');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format Ghana phone number with +233', () => {
      expect(formatPhoneNumber('+233241234567')).toBe('+233 24 123 4567');
    });

    it('should format Ghana phone number starting with 0', () => {
      expect(formatPhoneNumber('0241234567')).toBe('024 123 4567');
    });

    it('should return unformatted for other formats', () => {
      expect(formatPhoneNumber('1234567890')).toBe('1234567890');
    });
  });

  describe('slugify', () => {
    it('should convert text to slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(slugify('Hello! World?')).toBe('hello-world');
    });

    it('should handle multiple spaces', () => {
      expect(slugify('Hello   World')).toBe('hello-world');
    });

    it('should handle underscores', () => {
      expect(slugify('hello_world')).toBe('hello-world');
    });

    it('should trim leading/trailing hyphens', () => {
      expect(slugify('--hello world--')).toBe('hello-world');
    });

    it('should handle empty string', () => {
      expect(slugify('')).toBe('');
    });
  });

  describe('truncate', () => {
    it('should truncate long text', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
    });

    it('should not truncate short text', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('should handle exact length', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(truncate('', 5)).toBe('');
    });
  });

  describe('generateOTP', () => {
    it('should generate 6-digit OTP', () => {
      const otp = generateOTP();
      expect(otp).toHaveLength(6);
    });

    it('should generate numeric OTP', () => {
      const otp = generateOTP();
      expect(/^\d{6}$/.test(otp)).toBe(true);
    });

    it('should generate different OTPs', () => {
      const otps = new Set();
      for (let i = 0; i < 10; i++) {
        otps.add(generateOTP());
      }
      expect(otps.size).toBeGreaterThan(1);
    });
  });
});

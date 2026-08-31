import { formatAmount } from '@/lib/theteller';

describe('Theteller formatAmount Edge Cases', () => {
  describe('zero and small amounts', () => {
    it('should format 0 GHS as "000000000000"', () => {
      expect(formatAmount(0)).toBe('000000000000');
    });

    it('should format 0.0 GHS as "000000000000"', () => {
      expect(formatAmount(0.0)).toBe('000000000000');
    });

    it('should format 0.01 GHS (1 pesewa) as "000000000001"', () => {
      expect(formatAmount(0.01)).toBe('000000000001');
    });

    it('should format 0.1 GHS (10 pesewas) as "000000000010"', () => {
      expect(formatAmount(0.1)).toBe('000000000010');
    });

    it('should format 0.5 GHS (50 pesewas) as "000000000050"', () => {
      expect(formatAmount(0.5)).toBe('000000000050');
    });

    it('should format 0.99 GHS (99 pesewas) as "000000000099"', () => {
      expect(formatAmount(0.99)).toBe('000000000099');
    });
  });

  describe('large amounts', () => {
    it('should format 999999.99 GHS (max reasonable amount)', () => {
      // 999999.99 * 100 = 99999999 pesewas
      expect(formatAmount(999999.99)).toBe('000099999999');
    });

    it('should format 1000000 GHS (1 million)', () => {
      // 1000000 * 100 = 100000000 pesewas
      expect(formatAmount(1000000)).toBe('000100000000');
    });

    it('should format 10000000 GHS (10 million)', () => {
      expect(formatAmount(10000000)).toBe('001000000000');
    });

    it('should format 99999999 GHS', () => {
      // 99999999 * 100 = 9999999900 pesewas → 10 digits, padded to 12
      expect(formatAmount(99999999)).toBe('9999999900'.padStart(12, '0'));
    });
  });

  describe('rounding behavior', () => {
    it('should round 0.005 GHS up to 1 pesewa', () => {
      // Math.round(0.005 * 100) = Math.round(0.5) = 1 (banker's rounding may vary, but Math.round rounds 0.5 up)
      expect(formatAmount(0.005)).toBe('000000000001');
    });

    it('should round 0.004 GHS down to 0 pesewas', () => {
      // Math.round(0.004 * 100) = Math.round(0.4) = 0
      expect(formatAmount(0.004)).toBe('000000000000');
    });

    it('should round 1.005 GHS correctly', () => {
      // Math.round(1.005 * 100) — floating point: 1.005 * 100 = 100.49999...
      // Math.round(100.49999...) = 100
      const result = formatAmount(1.005);
      expect(result).toMatch(/^0{9}1\d{2}$/);
    });

    it('should round 1.999 GHS to 200 pesewas', () => {
      // Math.round(1.999 * 100) = Math.round(199.9) = 200
      expect(formatAmount(1.999)).toBe('000000000200');
    });

    it('should round 99.999 GHS to 10000 pesewas', () => {
      // Math.round(99.999 * 100) = Math.round(9999.9) = 10000
      expect(formatAmount(99.999)).toBe('000000010000');
    });
  });

  describe('whole number amounts', () => {
    it('should format 1 GHS as "000000000100"', () => {
      expect(formatAmount(1)).toBe('000000000100');
    });

    it('should format 10 GHS as "000000001000"', () => {
      expect(formatAmount(10)).toBe('000000001000');
    });

    it('should format 100 GHS as "000000010000"', () => {
      expect(formatAmount(100)).toBe('000000010000');
    });

    it('should format 1000 GHS as "000000100000"', () => {
      expect(formatAmount(1000)).toBe('000000100000');
    });

    it('should format 10000 GHS as "000001000000"', () => {
      expect(formatAmount(10000)).toBe('000001000000');
    });
  });

  describe('decimal amounts', () => {
    it('should format 1.50 GHS as "000000000150"', () => {
      expect(formatAmount(1.5)).toBe('000000000150');
    });

    it('should format 12.34 GHS as "000000001234"', () => {
      expect(formatAmount(12.34)).toBe('000000001234');
    });

    it('should format 99.99 GHS as "000000009999"', () => {
      expect(formatAmount(99.99)).toBe('000000009999');
    });

    it('should format 123.45 GHS as "000000012345"', () => {
      expect(formatAmount(123.45)).toBe('000000012345');
    });
  });

  describe('invalid inputs', () => {
    it('should throw for negative amounts', () => {
      expect(() => formatAmount(-1)).toThrow('non-negative');
      expect(() => formatAmount(-0.01)).toThrow('non-negative');
      expect(() => formatAmount(-1000)).toThrow('non-negative');
    });

    it('should throw for NaN', () => {
      expect(() => formatAmount(NaN)).toThrow('non-negative');
    });

    it('should not produce valid 12-digit output for Infinity', () => {
      // Infinity is not NaN and not negative, so it passes the guard.
      // The result will not be a valid 12-digit numeric string.
      const result = formatAmount(Infinity);
      expect(/^\d{12}$/.test(result)).toBe(false);
    });

    it('should throw for -Infinity (negative)', () => {
      expect(() => formatAmount(-Infinity)).toThrow('non-negative');
    });
  });

  describe('output format', () => {
    it('should always return a 12-character string', () => {
      expect(formatAmount(0)).toHaveLength(12);
      expect(formatAmount(1)).toHaveLength(12);
      expect(formatAmount(100)).toHaveLength(12);
      expect(formatAmount(999999.99)).toHaveLength(12);
    });

    it('should always return numeric-only string', () => {
      expect(/^\d{12}$/.test(formatAmount(0))).toBe(true);
      expect(/^\d{12}$/.test(formatAmount(1))).toBe(true);
      expect(/^\d{12}$/.test(formatAmount(999999.99))).toBe(true);
    });

    it('should zero-pad on the left', () => {
      expect(formatAmount(1)).toMatch(/^0+/);
      expect(formatAmount(0.01)).toMatch(/^0+/);
    });
  });
});

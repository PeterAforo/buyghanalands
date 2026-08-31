import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear rate limit store between tests by waiting
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      const config = { limit: 3, windowSeconds: 60, identifier: 'test' };
      
      const result1 = await checkRateLimit('user1', config);
      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(2);

      const result2 = await checkRateLimit('user1', config);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(1);

      const result3 = await checkRateLimit('user1', config);
      expect(result3.success).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it('should block requests exceeding limit', async () => {
      const config = { limit: 2, windowSeconds: 60, identifier: 'test-block' };
      
      await checkRateLimit('user2', config);
      await checkRateLimit('user2', config);
      
      const result = await checkRateLimit('user2', config);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfterSeconds).toBeDefined();
    });

    it('should track different keys separately', async () => {
      const config = { limit: 1, windowSeconds: 60, identifier: 'test-separate' };
      
      const result1 = await checkRateLimit('userA', config);
      expect(result1.success).toBe(true);

      const result2 = await checkRateLimit('userB', config);
      expect(result2.success).toBe(true);

      const result3 = await checkRateLimit('userA', config);
      expect(result3.success).toBe(false);
    });

    it('should reset after window expires', async () => {
      const config = { limit: 1, windowSeconds: 1, identifier: 'test-reset' };
      
      const result1 = await checkRateLimit('user3', config);
      expect(result1.success).toBe(true);

      const result2 = await checkRateLimit('user3', config);
      expect(result2.success).toBe(false);

      // Advance time past the window
      jest.advanceTimersByTime(2000);

      const result3 = await checkRateLimit('user3', config);
      expect(result3.success).toBe(true);
    });
  });

  describe('RATE_LIMITS presets', () => {
    it('should have OTP_SEND preset configured', () => {
      expect(RATE_LIMITS.OTP_SEND).toBeDefined();
      expect(RATE_LIMITS.OTP_SEND.limit).toBe(3);
      expect(RATE_LIMITS.OTP_SEND.windowSeconds).toBe(300);
    });

    it('should have REGISTER preset configured', () => {
      expect(RATE_LIMITS.REGISTER).toBeDefined();
      expect(RATE_LIMITS.REGISTER.limit).toBe(5);
      expect(RATE_LIMITS.REGISTER.windowSeconds).toBe(3600);
    });

    it('should have LOGIN preset configured', () => {
      expect(RATE_LIMITS.LOGIN).toBeDefined();
      expect(RATE_LIMITS.LOGIN.limit).toBe(10);
      expect(RATE_LIMITS.LOGIN.windowSeconds).toBe(900);
    });
  });
});

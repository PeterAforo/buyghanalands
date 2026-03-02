/**
 * @jest-environment node
 */
import { generateCSRFToken } from '@/lib/csrf';

describe('CSRF Protection', () => {
  describe('generateCSRFToken', () => {
    it('should generate a token string', () => {
      const token = generateCSRFToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate 64-character hex token (32 bytes)', () => {
      const token = generateCSRFToken();
      expect(token.length).toBe(64);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set();
      for (let i = 0; i < 10; i++) {
        tokens.add(generateCSRFToken());
      }
      expect(tokens.size).toBe(10);
    });

    it('should generate hex string', () => {
      const token = generateCSRFToken();
      expect(/^[a-f0-9]+$/i.test(token)).toBe(true);
    });
  });
});

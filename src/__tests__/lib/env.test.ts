import { getEnv, checkServiceHealth } from '@/lib/env';

describe('Environment Validation Module', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset env to a clean state for each test
    process.env = { ...originalEnv };
    // Clear the cached _env by re-importing — use jest.resetModules approach
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
  });

  describe('getEnv', () => {
    it('should throw if required vars are missing', () => {
      // Remove required vars
      delete process.env.DATABASE_URL;
      delete process.env.DIRECT_URL;
      delete process.env.AUTH_SECRET;
      delete process.env.NEXTAUTH_URL;
      delete process.env.NEXT_PUBLIC_APP_URL;

      // Suppress console.warn for optional vars
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      // Re-import to reset the cached _env
      jest.isolateModules(() => {
        const { getEnv } = require('@/lib/env');
        expect(() => getEnv()).toThrow('Missing required environment variables');
      });

      warnSpy.mockRestore();
    });

    it('should throw listing all missing required vars', () => {
      delete process.env.DATABASE_URL;
      delete process.env.AUTH_SECRET;

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      jest.isolateModules(() => {
        const { getEnv } = require('@/lib/env');
        expect(() => getEnv()).toThrow(/DATABASE_URL/);
        expect(() => getEnv()).toThrow(/AUTH_SECRET/);
      });

      warnSpy.mockRestore();
    });

    it('should return config object when required vars are set', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.DIRECT_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.AUTH_SECRET = 'test-secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      jest.isolateModules(() => {
        const { getEnv } = require('@/lib/env');
        const config = getEnv();
        expect(config).toBeDefined();
        expect(config.database.url).toBe('postgresql://user:pass@localhost:5432/db');
        expect(config.auth.secret).toBe('test-secret');
        expect(config.auth.url).toBe('http://localhost:3000');
        expect(config.auth.appUrl).toBe('http://localhost:3000');
      });

      warnSpy.mockRestore();
    });

    it('should parse SMTP_PORT to number', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.DIRECT_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.AUTH_SECRET = 'test-secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
      process.env.SMTP_PORT = '465';

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      jest.isolateModules(() => {
        const { getEnv } = require('@/lib/env');
        const config = getEnv();
        expect(config.email.smtpPort).toBe(465);
      });

      warnSpy.mockRestore();
    });

    it('should default SMTP_PORT to 587 if missing', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.DIRECT_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.AUTH_SECRET = 'test-secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
      delete process.env.SMTP_PORT;

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      jest.isolateModules(() => {
        const { getEnv } = require('@/lib/env');
        const config = getEnv();
        expect(config.email.smtpPort).toBe(587);
      });

      warnSpy.mockRestore();
    });

    it('should parse SMTP_SECURE as boolean', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.DIRECT_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.AUTH_SECRET = 'test-secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
      process.env.SMTP_SECURE = 'true';

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      jest.isolateModules(() => {
        const { getEnv } = require('@/lib/env');
        const config = getEnv();
        expect(config.email.smtpSecure).toBe(true);
      });

      warnSpy.mockRestore();
    });
  });

  describe('checkServiceHealth', () => {
    it('should return booleans for each service', () => {
      const health = checkServiceHealth();
      expect(typeof health.database).toBe('boolean');
      expect(typeof health.theteller).toBe('boolean');
      expect(typeof health.meilisearch).toBe('boolean');
      expect(typeof health.sms).toBe('boolean');
      expect(typeof health.email).toBe('boolean');
      expect(typeof health.cloudinary).toBe('boolean');
      expect(typeof health.sentry).toBe('boolean');
      expect(typeof health.fcm).toBe('boolean');
      expect(typeof health.mapbox).toBe('boolean');
    });

    it('should return false for services without env vars', () => {
      delete process.env.SENTRY_DSN;
      delete process.env.FCM_SERVER_KEY;
      delete process.env.MAPBOX_ACCESS_TOKEN;

      const health = checkServiceHealth();
      expect(health.sentry).toBe(false);
      expect(health.fcm).toBe(false);
      expect(health.mapbox).toBe(false);
    });

    it('should return true for database when DATABASE_URL and DIRECT_URL are set', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.DIRECT_URL = 'postgresql://user:pass@localhost:5432/db';

      const health = checkServiceHealth();
      expect(health.database).toBe(true);
    });

    it('should return false for database when DATABASE_URL is missing', () => {
      delete process.env.DATABASE_URL;

      const health = checkServiceHealth();
      expect(health.database).toBe(false);
    });

    it('should return true for theteller when all theteller vars are set', () => {
      process.env.THETELLER_MERCHANT_ID = 'merchant';
      process.env.THETELLER_API_USER = 'user';
      process.env.THETELLER_API_KEY = 'key';
      process.env.THETELLER_PASS_CODE = 'pass';
      process.env.THETELLER_BASE_URL = 'https://test.theteller.net';
      process.env.THETELLER_CHECKOUT_URL = 'https://checkout.theteller.net';

      const health = checkServiceHealth();
      expect(health.theteller).toBe(true);
    });

    it('should return false for theteller when some vars are missing', () => {
      process.env.THETELLER_MERCHANT_ID = 'merchant';
      delete process.env.THETELLER_API_KEY;

      const health = checkServiceHealth();
      expect(health.theteller).toBe(false);
    });
  });
});

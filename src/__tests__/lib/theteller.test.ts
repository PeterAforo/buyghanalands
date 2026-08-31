import {
  generateTransactionId,
  formatAmount,
  initiateCheckout,
  verifyTransaction,
  transferToMobileMoney,
  transferToBank,
  ACCOUNT_ISSUERS,
  BANK_CODES,
} from '@/lib/theteller';

describe('Theteller Payment Library', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Set required env vars
    process.env.THETELLER_MERCHANT_ID = 'TTM-0000000000000001';
    process.env.THETELLER_API_USER = 'testapiuser';
    process.env.THETELLER_API_KEY = 'testapikey';
    process.env.THETELLER_PASS_CODE = 'testpasscode';
    process.env.THETELLER_BASE_URL = 'https://test.theteller.net';
    process.env.THETELLER_CHECKOUT_URL = 'https://checkout-test.theteller.net';

    // Mock global.fetch
    global.fetch = jest.fn() as jest.Mock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('generateTransactionId', () => {
    it('should return a 12-digit string', () => {
      const id = generateTransactionId();
      expect(id).toHaveLength(12);
      expect(/^\d{12}$/.test(id)).toBe(true);
    });

    it('should generate unique ids', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 20; i++) {
        ids.add(generateTransactionId());
      }
      expect(ids.size).toBeGreaterThan(1);
    });
  });

  describe('formatAmount', () => {
    it('should format 1.00 GHS as "000000000100"', () => {
      expect(formatAmount(1.0)).toBe('000000000100');
    });

    it('should format 100 GHS as "000000010000"', () => {
      expect(formatAmount(100)).toBe('000000010000');
    });

    it('should throw for negative amounts', () => {
      expect(() => formatAmount(-1)).toThrow();
    });

    it('should throw for non-number values', () => {
      expect(() => formatAmount(NaN)).toThrow();
    });
  });

  describe('initiateCheckout', () => {
    it('should return checkout_url on success', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          status: 'success',
          code: 200,
          reason: 'Success',
          token: 'test-token',
          checkout_url: 'https://checkout-test.theteller.net/checkout/test-token',
        }),
        text: jest.fn().mockResolvedValue(''),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await initiateCheckout({
        desc: 'Test payment',
        amountGhs: 100,
        email: 'test@example.com',
      });

      expect(result.status).toBe('success');
      expect(result.token).toBe('test-token');
      expect(result.checkout_url).toBe('https://checkout-test.theteller.net/checkout/test-token');
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://checkout-test.theteller.net/initiate',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should throw on failure when status is error', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          status: 'error',
          code: 400,
          reason: 'Invalid request',
        }),
        text: jest.fn().mockResolvedValue(''),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(
        initiateCheckout({
          desc: 'Test payment',
          amountGhs: 100,
          email: 'test@example.com',
        })
      ).rejects.toThrow();
    });

    it('should throw when fetch returns non-ok response', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn(),
        text: jest.fn().mockResolvedValue('Server error'),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(
        initiateCheckout({
          desc: 'Test payment',
          amountGhs: 100,
          email: 'test@example.com',
        })
      ).rejects.toThrow();
    });
  });

  describe('verifyTransaction', () => {
    it('should return approved status on success', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          code: '000',
          status: 'approved',
          reason: 'Success',
          transaction_id: '000000000100',
          r_switch: 'MTN',
          subscriber_number: '0240000000',
          amount: 100,
        }),
        text: jest.fn().mockResolvedValue(''),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await verifyTransaction('000000000100');
      expect(result.code).toBe('000');
      expect(result.status).toBe('approved');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.theteller.net/v1.1/users/transactions/000000000100/status',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return failed status for failed transaction', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          code: '100',
          status: 'failed',
          reason: 'Insufficient funds',
          transaction_id: '000000000100',
          r_switch: 'MTN',
          subscriber_number: '0240000000',
          amount: 100,
        }),
        text: jest.fn().mockResolvedValue(''),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await verifyTransaction('000000000100');
      expect(result.code).toBe('100');
      expect(result.status).toBe('failed');
    });

    it('should throw for invalid transaction id length', async () => {
      await expect(verifyTransaction('123')).rejects.toThrow('12-digit');
    });
  });

  describe('transferToMobileMoney', () => {
    it('should POST with processing_code "404000"', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          code: '000',
          status: 'success',
          reason: 'Transfer successful',
          transaction_id: '000000000100',
        }),
        text: jest.fn().mockResolvedValue(''),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await transferToMobileMoney({
        account_number: '0240000000',
        account_issuer: 'MTN',
        amountGhs: 50,
        desc: 'Test transfer',
      });

      expect(result.code).toBe('000');
      expect(result.status).toBe('success');

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.processing_code).toBe('404000');
      expect(body.account_issuer).toBe('MTN');
    });

    it('should throw for unsupported account_issuer', async () => {
      await expect(
        transferToMobileMoney({
          account_number: '0240000000',
          account_issuer: 'UNSUPPORTED',
          amountGhs: 50,
          desc: 'Test transfer',
        })
      ).rejects.toThrow('Unsupported account_issuer');
    });

    it('should throw for missing account_number', async () => {
      await expect(
        transferToMobileMoney({
          account_number: '',
          account_issuer: 'MTN',
          amountGhs: 50,
          desc: 'Test transfer',
        })
      ).rejects.toThrow('account_number is required');
    });
  });

  describe('transferToBank', () => {
    it('should POST with processing_code "404020"', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          code: '000',
          status: 'success',
          reason: 'Transfer successful',
          transaction_id: '000000000200',
        }),
        text: jest.fn().mockResolvedValue(''),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await transferToBank({
        account_number: '1234567890',
        account_bank: 'GCB',
        account_issuer: 'GIP',
        amountGhs: 1000,
        desc: 'Bank transfer',
      });

      expect(result.code).toBe('000');
      expect(result.status).toBe('success');

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.processing_code).toBe('404020');
      expect(body.account_bank).toBe('GCB');
    });

    it('should throw for missing account_bank', async () => {
      await expect(
        transferToBank({
          account_number: '1234567890',
          account_bank: '',
          account_issuer: 'GIP',
          amountGhs: 1000,
          desc: 'Bank transfer',
        })
      ).rejects.toThrow('account_bank is required');
    });
  });

  describe('ACCOUNT_ISSUERS', () => {
    it('should have MTN, ATL, VDF, TGO, ZPY, GMY, GIP', () => {
      expect(ACCOUNT_ISSUERS.MTN).toBeDefined();
      expect(ACCOUNT_ISSUERS.ATL).toBeDefined();
      expect(ACCOUNT_ISSUERS.VDF).toBeDefined();
      expect(ACCOUNT_ISSUERS.TGO).toBeDefined();
      expect(ACCOUNT_ISSUERS.ZPY).toBeDefined();
      expect(ACCOUNT_ISSUERS.GMY).toBeDefined();
      expect(ACCOUNT_ISSUERS.GIP).toBeDefined();
    });

    it('should have human-readable names', () => {
      expect(ACCOUNT_ISSUERS.MTN).toBe('MTN Mobile Money');
      expect(ACCOUNT_ISSUERS.GIP).toContain('Bank Transfer');
    });
  });

  describe('BANK_CODES', () => {
    it('should have GCB and other banks', () => {
      expect(BANK_CODES.GCB).toBeDefined();
      expect(BANK_CODES.GCB).toBe('GCB Bank Limited');
    });

    it('should have multiple banks', () => {
      expect(Object.keys(BANK_CODES).length).toBeGreaterThan(5);
    });
  });
});

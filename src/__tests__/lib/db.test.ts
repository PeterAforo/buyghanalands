import { withDbRetry } from '@/lib/db';

describe('DB Library', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('withDbRetry', () => {
    it('should succeed on first try if no error', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await withDbRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on connection errors', async () => {
      const connectionError = new Error("Can't reach database server");
      const operation = jest
        .fn()
        .mockRejectedValueOnce(connectionError)
        .mockResolvedValueOnce('success');

      const result = await withDbRetry(operation, { retries: 3, baseDelayMs: 1 });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should NOT retry on non-connection errors', async () => {
      const nonConnectionError = new Error('Unique constraint violation');
      const operation = jest.fn().mockRejectedValue(nonConnectionError);

      await expect(withDbRetry(operation, { baseDelayMs: 1 })).rejects.toThrow(
        'Unique constraint violation'
      );
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on "Connection terminated" error', async () => {
      const connectionError = new Error('Connection terminated');
      const operation = jest
        .fn()
        .mockRejectedValueOnce(connectionError)
        .mockResolvedValueOnce('success');

      const result = await withDbRetry(operation, { retries: 3, baseDelayMs: 1 });
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should retry on "Connection timeout" error', async () => {
      const connectionError = new Error('Connection timeout');
      const operation = jest
        .fn()
        .mockRejectedValueOnce(connectionError)
        .mockResolvedValueOnce('success');

      const result = await withDbRetry(operation, { retries: 3, baseDelayMs: 1 });
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should retry on "Timed out" error', async () => {
      const connectionError = new Error('Timed out fetching connection');
      const operation = jest
        .fn()
        .mockRejectedValueOnce(connectionError)
        .mockResolvedValueOnce('success');

      const result = await withDbRetry(operation, { retries: 3, baseDelayMs: 1 });
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should retry on ECONNRESET error', async () => {
      const connectionError = new Error('read ECONNRESET');
      const operation = jest
        .fn()
        .mockRejectedValueOnce(connectionError)
        .mockResolvedValueOnce('success');

      const result = await withDbRetry(operation, { retries: 3, baseDelayMs: 1 });
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should retry on ETIMEDOUT error', async () => {
      const connectionError = new Error('connect ETIMEDOUT');
      const operation = jest
        .fn()
        .mockRejectedValueOnce(connectionError)
        .mockResolvedValueOnce('success');

      const result = await withDbRetry(operation, { retries: 3, baseDelayMs: 1 });
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should retry on PrismaClientInitializationError', async () => {
      const connectionError = new Error("PrismaClientInitializationError: Can't connect");
      const operation = jest
        .fn()
        .mockRejectedValueOnce(connectionError)
        .mockResolvedValueOnce('success');

      const result = await withDbRetry(operation, { retries: 3, baseDelayMs: 1 });
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should retry up to 3 times then throw', async () => {
      const connectionError = new Error("Can't reach database server");
      const operation = jest.fn().mockRejectedValue(connectionError);

      await expect(
        withDbRetry(operation, { retries: 3, baseDelayMs: 1 })
      ).rejects.toThrow("Can't reach database server");
      expect(operation).toHaveBeenCalledTimes(4); // initial + 3 retries
    });

    it('should use exponential backoff', async () => {
      const connectionError = new Error("Can't reach database server");
      const operation = jest
        .fn()
        .mockRejectedValueOnce(connectionError)
        .mockRejectedValueOnce(connectionError)
        .mockResolvedValueOnce('success');

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await withDbRetry(operation, { retries: 3, baseDelayMs: 1 });
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);

      // Check warning messages mention the attempts
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('attempt 1/4'),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('attempt 2/4'),
      );

      warnSpy.mockRestore();
    });

    it('should use default options when none provided', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await withDbRetry(operation);
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should handle non-Error thrown values', async () => {
      const operation = jest.fn().mockRejectedValue('string error');

      await expect(withDbRetry(operation, { baseDelayMs: 1 })).rejects.toBe('string error');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry the correct number of times with retries=2', async () => {
      const connectionError = new Error("Can't reach database server");
      const operation = jest.fn().mockRejectedValue(connectionError);

      await expect(
        withDbRetry(operation, { retries: 2, baseDelayMs: 1 })
      ).rejects.toThrow();
      expect(operation).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('should retry the correct number of times with retries=0', async () => {
      const connectionError = new Error("Can't reach database server");
      const operation = jest.fn().mockRejectedValue(connectionError);

      await expect(
        withDbRetry(operation, { retries: 0, baseDelayMs: 1 })
      ).rejects.toThrow();
      expect(operation).toHaveBeenCalledTimes(1); // no retries
    });

    it('should succeed after multiple retries', async () => {
      const connectionError = new Error("Can't reach database server");
      const operation = jest
        .fn()
        .mockRejectedValueOnce(connectionError)
        .mockRejectedValueOnce(connectionError)
        .mockRejectedValueOnce(connectionError)
        .mockResolvedValueOnce('success');

      const result = await withDbRetry(operation, { retries: 3, baseDelayMs: 1 });
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(4);
    });
  });
});

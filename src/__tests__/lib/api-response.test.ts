import { 
  successResponse, 
  errorResponse, 
  ApiErrors, 
  ErrorCodes,
  handleZodError 
} from '@/lib/api-response';
import { z } from 'zod';

describe('API Response Utilities', () => {
  describe('successResponse', () => {
    it('should create a success response with data', async () => {
      const data = { id: '123', name: 'Test' };
      const response = successResponse(data);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.data).toEqual(data);
      expect(json.meta?.requestId).toBeDefined();
    });

    it('should include meta information', async () => {
      const data = { items: [] };
      const meta = { page: 1, limit: 10, total: 100 };
      const response = successResponse(data, 200, meta);
      const json = await response.json();

      expect(json.meta?.page).toBe(1);
      expect(json.meta?.limit).toBe(10);
      expect(json.meta?.total).toBe(100);
    });

    it('should use custom status code', () => {
      const response = successResponse({ created: true }, 201);
      expect(response.status).toBe(201);
    });
  });

  describe('errorResponse', () => {
    it('should create an error response', async () => {
      const response = errorResponse(ErrorCodes.NOT_FOUND, 'User not found', 404);
      const json = await response.json();

      expect(json.success).toBe(false);
      expect(json.error.code).toBe('NOT_FOUND');
      expect(json.error.message).toBe('User not found');
      expect(response.status).toBe(404);
    });

    it('should include details when provided', async () => {
      const details = { field: 'email', issue: 'invalid format' };
      const response = errorResponse(ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, details);
      const json = await response.json();

      expect(json.error.details).toEqual(details);
    });
  });

  describe('ApiErrors helpers', () => {
    it('should create unauthorized error', async () => {
      const response = ApiErrors.unauthorized();
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('should create forbidden error', async () => {
      const response = ApiErrors.forbidden();
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('should create not found error with custom resource', async () => {
      const response = ApiErrors.notFound('Listing');
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error.message).toBe('Listing not found');
    });

    it('should create rate limited error with retry after', async () => {
      const response = ApiErrors.rateLimited(60);
      const json = await response.json();

      expect(response.status).toBe(429);
      expect(json.error.details).toEqual({ retryAfterSeconds: 60 });
    });
  });

  describe('handleZodError', () => {
    it('should format Zod errors correctly', async () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      try {
        schema.parse({ email: 'invalid', age: 10 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const response = handleZodError(error);
          const json = await response.json();

          expect(json.success).toBe(false);
          expect(json.error.code).toBe('VALIDATION_ERROR');
          expect(Array.isArray(json.error.details)).toBe(true);
        }
      }
    });
  });
});

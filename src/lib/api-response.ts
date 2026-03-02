import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standardized API Response Utility
 * Provides consistent response format across all API endpoints
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    requestId?: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Error codes
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  
  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  
  // Resource
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",
  
  // Rate Limiting
  RATE_LIMITED: "RATE_LIMITED",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
  
  // Business Logic
  INVALID_STATE: "INVALID_STATE",
  INVALID_TRANSITION: "INVALID_TRANSITION",
  INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
  OPERATION_NOT_ALLOWED: "OPERATION_NOT_ALLOWED",
  
  // Server
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
} as const;

type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  meta?: ApiSuccessResponse["meta"]
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        ...meta,
        requestId: `req_${Date.now()}`,
      },
    },
    { status }
  );
}

/**
 * Create an error response
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  status: number = 400,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const errorObj: ApiErrorResponse["error"] = {
    code,
    message,
  };
  
  if (details !== undefined) {
    errorObj.details = details;
  }
  
  return NextResponse.json(
    {
      success: false,
      error: errorObj,
    },
    { status }
  );
}

/**
 * Common error responses
 */
export const ApiErrors = {
  unauthorized: (message = "Authentication required") =>
    errorResponse(ErrorCodes.UNAUTHORIZED, message, 401),

  forbidden: (message = "You don't have permission to perform this action") =>
    errorResponse(ErrorCodes.FORBIDDEN, message, 403),

  notFound: (resource = "Resource") =>
    errorResponse(ErrorCodes.NOT_FOUND, `${resource} not found`, 404),

  validationError: (details: unknown) =>
    errorResponse(ErrorCodes.VALIDATION_ERROR, "Validation failed", 400, details),

  conflict: (message: string) =>
    errorResponse(ErrorCodes.CONFLICT, message, 409),

  rateLimited: (retryAfter?: number) => {
    const details = retryAfter ? { retryAfterSeconds: retryAfter } : undefined;
    return errorResponse(
      ErrorCodes.RATE_LIMITED,
      "Too many requests. Please try again later.",
      429,
      details
    );
  },

  invalidState: (message: string) =>
    errorResponse(ErrorCodes.INVALID_STATE, message, 400),

  internalError: (message = "An unexpected error occurred") =>
    errorResponse(ErrorCodes.INTERNAL_ERROR, message, 500),
};

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: ZodError): NextResponse<ApiErrorResponse> {
  const details = error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));

  return ApiErrors.validationError(details);
}

/**
 * Wrap an API handler with standardized error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error);
      }

      // Log error for debugging (in production, use proper logging)
      if (process.env.NODE_ENV === "development") {
        console.error("API Error:", error);
      }

      return ApiErrors.internalError();
    }
  }) as T;
}

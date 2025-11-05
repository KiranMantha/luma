import type { Context } from 'hono';

export type ApiResponse<T = any> = {
  data: T | null;
  error: string | null;
};

export type ApiErrorResponse = {
  data: null;
  error: string;
};

export type ApiSuccessResponse<T = any> = {
  data: T;
  error: null;
};

// Success response helper
export function successResponse<T>(ctx: Context, data: T, status?: 200 | 201) {
  const response: ApiSuccessResponse<T> = {
    data,
    error: null,
  };
  return ctx.json(response, status);
}

// Error response helper
export function errorResponse(ctx: Context, error: string, status?: 400 | 401 | 403 | 404 | 409 | 500) {
  const response: ApiErrorResponse = {
    data: null,
    error,
  };
  return ctx.json(response, status);
}

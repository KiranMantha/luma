import type { Context } from 'hono';

export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
}

export interface ApiErrorResponse {
  data: null;
  error: string;
}

export interface ApiSuccessResponse<T = any> {
  data: T;
  error: null;
}

// Success response helper
export function successResponse<T>(c: Context, data: T, status?: 200 | 201) {
  const response: ApiSuccessResponse<T> = {
    data,
    error: null,
  };
  return c.json(response, status);
}

// Error response helper
export function errorResponse(c: Context, error: string, status?: 400 | 401 | 403 | 404 | 409 | 500) {
  const response: ApiErrorResponse = {
    data: null,
    error,
  };
  return c.json(response, status);
}

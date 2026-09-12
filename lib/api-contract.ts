import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
    requestId?: string;
    details?: unknown;
  };
};

export function apiSuccess<T>(data: T, status = 200, headers?: HeadersInit) {
  return NextResponse.json(data, { status, headers });
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  options: { requestId?: string; details?: unknown; headers?: HeadersInit } = {},
) {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
      ...(options.requestId ? { requestId: options.requestId } : {}),
      ...(options.details === undefined ? {} : { details: options.details }),
    },
  };

  return NextResponse.json(body, {
    status,
    headers: options.headers,
  });
}

export function requestIdFromHeaders(headers: Headers) {
  const value = headers.get("x-request-id")?.trim();
  return value && value.length <= 128 ? value : undefined;
}

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

export function createRequestId() {
  return `req_${crypto.randomUUID()}`;
}

export function requestIdFromHeaders(headers: Headers) {
  const value = headers.get("x-request-id")?.trim();
  return value && value.length <= 128 ? value : undefined;
}

export function resolveRequestId(headers: Headers) {
  return requestIdFromHeaders(headers) ?? createRequestId();
}

export function withRequestId(headers: HeadersInit | undefined, requestId: string) {
  const result = new Headers(headers);
  result.set("x-request-id", requestId);
  return result;
}

export function apiSuccess<T>(data: T, status = 200, headers?: HeadersInit, requestId?: string) {
  const responseHeaders = requestId ? withRequestId(headers, requestId) : headers;
  return NextResponse.json(data, { status, headers: responseHeaders });
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

  const responseHeaders = options.requestId
    ? withRequestId(options.headers, options.requestId)
    : options.headers;

  return NextResponse.json(body, {
    status,
    headers: responseHeaders,
  });
}

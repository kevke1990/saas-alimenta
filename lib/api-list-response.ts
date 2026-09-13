import { apiSuccess } from "./api-contract";
import { toPageResult } from "./pagination";

export type ApiListResponse<T> = {
  data: T[];
  pagination: { limit: number; count: number; nextCursor?: string };
  apiVersion: "v1";
};

export function apiListResponse<T>(items: T[], limit: number, cursorForItem: (item: T) => string, requestId?: string) {
  const page = toPageResult(items, limit, cursorForItem);
  const body: ApiListResponse<T> = {
    data: page.items,
    pagination: { limit, count: page.items.length, ...(page.nextCursor ? { nextCursor: page.nextCursor } : {}) },
    apiVersion: "v1",
  };
  return apiSuccess(body, 200, undefined, requestId);
}

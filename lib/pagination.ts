export type PageInput = {
  limit?: number | string | null;
  cursor?: string | null;
};

export type PageOptions = {
  defaultLimit?: number;
  maxLimit?: number;
};

export type PageResult<T> = {
  items: T[];
  nextCursor?: string;
};

export function parsePageInput(input: PageInput, options: PageOptions = {}) {
  const defaultLimit = Math.max(1, Math.floor(options.defaultLimit ?? 25));
  const maxLimit = Math.max(defaultLimit, Math.floor(options.maxLimit ?? 100));
  const raw = typeof input.limit === "string" ? Number(input.limit) : input.limit;
  const limit = Number.isFinite(raw) && raw !== null ? Math.floor(Number(raw)) : defaultLimit;
  const cursor = typeof input.cursor === "string" && input.cursor.trim() ? input.cursor.trim() : undefined;

  return {
    limit: Math.min(maxLimit, Math.max(1, limit)),
    cursor,
  };
}

export function toPageResult<T>(items: T[], limit: number, cursorForItem: (item: T) => string) {
  const hasMore = items.length > limit;
  const visible = hasMore ? items.slice(0, limit) : items;
  return {
    items: visible,
    ...(hasMore && visible.length ? { nextCursor: cursorForItem(visible[visible.length - 1]) } : {}),
  } satisfies PageResult<T>;
}

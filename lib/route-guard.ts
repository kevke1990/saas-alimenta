export function isProtectedAppPath(pathname: string) {
  const protectedPrefixes = ["/clients", "/cases", "/work", "/dashboard", "/team", "/settings", "/profile", "/documents", "/income", "/beheer"];
  const normalized = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  return protectedPrefixes.some((prefix) => normalized === prefix || normalized.startsWith(prefix + "/"));
}

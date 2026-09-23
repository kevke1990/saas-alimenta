export function isProtectedAppPath(pathname: string) {
  const protectedPrefixes = [
    "/dashboard",
    "/work",
    "/clients",
    "/cases",
    "/scan",
    "/mail",
    "/billing",
    "/settings",
    "/team",
    "/tasks",
    "/documents",
    "/income",
    "/profile",
    "/beheer",
  ];
  const normalized = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  return protectedPrefixes.some((prefix) => normalized === prefix || normalized.startsWith(prefix + "/"));
}

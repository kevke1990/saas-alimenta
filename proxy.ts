import { NextResponse, type NextRequest } from "next/server";
import { isProtectedAppPath } from "@/lib/tenant";

export function proxy(request: NextRequest) {
  if (!isProtectedAppPath(request.nextUrl.pathname)) return NextResponse.next();
  const hasSessionCookie = request.cookies.has("__Host-ka_session") || request.cookies.has("ka_session");
  if (hasSessionCookie) return NextResponse.next();
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|sw.js).*)"],
};

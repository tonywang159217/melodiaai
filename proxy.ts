import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const PUBLIC_PATHS = [
  "/",
  "/pricing",
  "/auth/login",
  "/auth/signup",
  "/auth/confirm",
  "/auth/reset-password",
  "/auth/update-password",
  "/api/auth/callback",
  "/api/webhooks/lemonsqueezy",
];

const SKIP_PREFIXES = [
  "/_next",
  "/_vercel",
  "/static",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  if (/\.(png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|css|js|mjs|map)$/i.test(pathname)) {
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);

  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/webhooks/");

  if (!isPublic && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url, { headers: response.headers });
  }

  if (
    user &&
    (pathname === "/auth/login" ||
      pathname === "/auth/signup" ||
      pathname === "/auth/reset-password")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url, { headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|css|js|mjs|map)$).*)",
  ],
};
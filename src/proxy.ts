import { NextResponse, type NextRequest } from "next/server";

// Fast, Edge-safe first pass: just checks whether a session cookie is present
// and bounces straight to /login if not. The authoritative check (session
// validity, approval status, admin role) happens server-side in each route
// group's layout via requireUser()/requireAdmin() — see src/lib/auth.ts —
// because that needs Prisma/Node APIs that don't run in Edge middleware.
const PROTECTED_PREFIXES = [
  "/lernen",
  "/pruefung",
  "/bildfragen",
  "/wiederholungen",
  "/fortschritt",
  "/konto",
  "/admin",
];

const SESSION_COOKIE = "af_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isHome = pathname === "/";
  const isProtected = isHome || PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isProtected) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has(SESSION_COOKIE);
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|branding|storage|datenschutz|login|register|passwort-vergessen|pending).*)",
  ],
};

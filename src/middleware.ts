import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Uses the lightweight edge-safe config (no bcryptjs/Prisma) so this
// middleware stays well under Vercel's Edge Function size limit.
// NOTE: keep this file free of any import that pulls in @/lib/prisma
// (directly or transitively, e.g. via @/lib/plaza) — Prisma's client
// isn't Edge-Runtime compatible and bloats the middleware bundle past
// Vercel's 1MB Edge Function limit (see git history for the incident).
const { auth } = NextAuth(authConfig);

// Kept as a literal in sync with PLAZA_COOKIE_NAME in @/lib/plaza —
// duplicated on purpose, do not import it from there.
const PLAZA_COOKIE_NAME = "selectedPlazaId";

const PUBLIC_PATHS = ["/login"];
const PLAZA_EXEMPT_PATHS = ["/login", "/select-company", "/select-plaza", "/platform-admin"];

export default auth((req) => {
  const isPublic = PUBLIC_PATHS.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  if (!req.auth && !isPublic) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (req.auth && req.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  const isPlazaExempt = PLAZA_EXEMPT_PATHS.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );
  if (req.auth && !isPlazaExempt && !req.cookies.get(PLAZA_COOKIE_NAME)) {
    return NextResponse.redirect(new URL("/select-company", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|sw.js|offline.html|apple-touch-icon.png|icons/).*)",
  ],
};

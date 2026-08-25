import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Uses the lightweight edge-safe config (no bcryptjs/Prisma) so this
// middleware stays well under Vercel's Edge Function size limit.
const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login"];

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

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};

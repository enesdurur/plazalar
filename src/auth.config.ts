import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role } from "@prisma/client";

// Edge-safe config: used by middleware to check whether a session exists.
// Deliberately excludes bcryptjs/Prisma (not Edge-Runtime compatible and
// would blow past Vercel's Edge Function size limit) — the real
// `authorize()` implementation lives only in src/auth.ts, which runs in
// the Node.js runtime (API route, server actions, server components).
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [Credentials({ credentials: { email: {}, password: {} } })],
  callbacks: {
    jwt: ({ token, user }) => {
      const t = token as typeof token & { id?: string; role?: Role };
      if (user) {
        t.id = user.id;
        t.role = user.role;
      }
      return t;
    },
    session: ({ session, token }) => {
      const t = token as typeof token & { id: string; role: Role };
      session.user.id = t.id;
      session.user.role = t.role;
      return session;
    },
  },
} satisfies NextAuthConfig;

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { authConfig } from "./auth.config";

declare module "next-auth" {
  interface User {
    role: Role;
    organizationId: string;
    isPlatformAdmin: boolean;
    isSuperAdmin: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      name: string;
      email: string;
      organizationId: string;
      isPlatformAdmin: boolean;
      isSuperAdmin: boolean;
    };
  }
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    // Sessions issued before organizationId existed on the JWT won't carry it yet.
    // Self-heal on the next request instead of forcing every user to log back in.
    jwt: async (params) => {
      const token = authConfig.callbacks.jwt(params);
      const t = token as typeof token & {
        id?: string;
        organizationId?: string;
        isPlatformAdmin?: boolean;
        isSuperAdmin?: boolean;
      };
      if (!params.user && t.id && !t.organizationId) {
        const dbUser = await prisma.user.findUnique({ where: { id: t.id } });
        if (dbUser) {
          t.organizationId = dbUser.organizationId;
          t.isPlatformAdmin = dbUser.isPlatformAdmin;
          t.isSuperAdmin = dbUser.isSuperAdmin;
        }
      }
      return t;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const now = new Date();
        const attempt = await prisma.loginAttempt.findUnique({ where: { email } });
        if (attempt?.lockedUntil && attempt.lockedUntil > now) {
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          const windowExpired =
            !attempt || now.getTime() - attempt.windowStart.getTime() > LOGIN_ATTEMPT_WINDOW_MS;
          const failedCount = windowExpired ? 1 : attempt.failedCount + 1;
          const lockedUntil =
            failedCount >= MAX_LOGIN_ATTEMPTS ? new Date(now.getTime() + LOGIN_LOCKOUT_MS) : null;
          await prisma.loginAttempt.upsert({
            where: { email },
            create: { email, failedCount, windowStart: now, lockedUntil },
            update: {
              failedCount,
              windowStart: windowExpired ? now : attempt.windowStart,
              lockedUntil,
            },
          });
          return null;
        }

        if (attempt) {
          await prisma.loginAttempt.delete({ where: { email } }).catch(() => {});
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          isPlatformAdmin: user.isPlatformAdmin,
          isSuperAdmin: user.isSuperAdmin,
        };
      },
    }),
  ],
});

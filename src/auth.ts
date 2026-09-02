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
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      name: string;
      email: string;
      organizationId: string;
      isPlatformAdmin: boolean;
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    // Sessions issued before organizationId existed on the JWT won't carry it yet.
    // Self-heal on the next request instead of forcing every user to log back in.
    jwt: async (params) => {
      const token = authConfig.callbacks.jwt(params);
      const t = token as typeof token & { id?: string; organizationId?: string; isPlatformAdmin?: boolean };
      if (!params.user && t.id && !t.organizationId) {
        const dbUser = await prisma.user.findUnique({ where: { id: t.id } });
        if (dbUser) {
          t.organizationId = dbUser.organizationId;
          t.isPlatformAdmin = dbUser.isPlatformAdmin;
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

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          isPlatformAdmin: user.isPlatformAdmin,
        };
      },
    }),
  ],
});

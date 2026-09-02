"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PLAZA_COOKIE_NAME } from "@/lib/plaza";

export async function selectPlaza(plazaId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const plaza = await prisma.plaza.findFirst({
    where: { id: plazaId, organizationId: session.user.organizationId },
  });
  if (!plaza) redirect("/select-plaza");

  const store = await cookies();
  store.set(PLAZA_COOKIE_NAME, plazaId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/");
}

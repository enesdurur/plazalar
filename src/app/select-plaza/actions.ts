"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PLAZA_COOKIE_NAME } from "@/lib/plaza";

export async function selectPlaza(plazaId: string) {
  const store = await cookies();
  store.set(PLAZA_COOKIE_NAME, plazaId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/");
}

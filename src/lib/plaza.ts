import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const PLAZA_COOKIE_NAME = "selectedPlazaId";

export async function getSelectedPlaza() {
  const store = await cookies();
  const id = store.get(PLAZA_COOKIE_NAME)?.value;
  if (!id) redirect("/select-plaza");

  const plaza = await prisma.plaza.findUnique({ where: { id } });
  if (!plaza) redirect("/select-plaza");

  return plaza;
}

export async function getSelectedPlazaId() {
  const store = await cookies();
  return store.get(PLAZA_COOKIE_NAME)?.value;
}

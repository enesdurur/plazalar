import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const PLAZA_COOKIE_NAME = "selectedPlazaId";

export async function getSelectedPlaza() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const store = await cookies();
  const id = store.get(PLAZA_COOKIE_NAME)?.value;
  if (!id) redirect("/select-plaza");

  const plaza = await prisma.plaza.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!plaza) redirect("/select-plaza");

  return plaza;
}

export async function getSelectedPlazaId() {
  const store = await cookies();
  return store.get(PLAZA_COOKIE_NAME)?.value;
}

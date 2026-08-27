"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";

const schema = z.object({
  floor: z.string().min(1, "Kat zorunludur"),
  companyName: z.string().min(1, "Kiracı adı zorunludur"),
  sortOrder: z.coerce.number().int().default(0),
});

function emptyToUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

function parseForm(formData: FormData) {
  return schema.parse({
    floor: formData.get("floor"),
    companyName: formData.get("companyName"),
    sortOrder: emptyToUndefined(formData.get("sortOrder")) ?? 0,
  });
}

async function requireWriteAccess() {
  const session = await auth();
  if (!session?.user || !canWrite(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
}

export async function createTenant(formData: FormData) {
  await requireWriteAccess();
  const plaza = await getSelectedPlaza();
  const data = parseForm(formData);

  await prisma.tenant.create({ data: { ...data, plazaId: plaza.id } });

  revalidatePath("/tenants");
  redirect("/tenants");
}

export async function updateTenant(id: string, formData: FormData) {
  await requireWriteAccess();
  const plaza = await getSelectedPlaza();
  const data = parseForm(formData);

  await prisma.tenant.updateMany({ where: { id, plazaId: plaza.id }, data });

  revalidatePath("/tenants");
  redirect("/tenants");
}

export async function deleteTenant(id: string) {
  const session = await auth();
  if (!session?.user || !canDelete(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  const plaza = await getSelectedPlaza();

  await prisma.tenant.deleteMany({ where: { id, plazaId: plaza.id } });
  revalidatePath("/tenants");
}

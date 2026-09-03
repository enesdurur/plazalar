"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";

// Haftalık matrise geçilmeden önceki eski MaintenancePlanEntry kayıtları için — bu modülün
// tek düzenlenebilir/silinebilir freestanding kaydı, o yüzden kendi küçük CRUD'u burada.
const schema = z.object({
  cost: z.coerce.number().optional(),
  costCurrency: z.enum(["TRY", "USD", "EUR"]).default("TRY"),
  note: z.string().optional(),
});

function emptyToUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

export async function updateMaintenancePlanEntry(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || !canWrite(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  const plaza = await getSelectedPlaza();

  const data = schema.parse({
    cost: emptyToUndefined(formData.get("cost")),
    costCurrency: emptyToUndefined(formData.get("costCurrency")) ?? "TRY",
    note: emptyToUndefined(formData.get("note")),
  });

  const existing = await prisma.maintenancePlanEntry.findFirst({
    where: { id, machine: { plazaId: plaza.id } },
  });
  if (!existing) throw new Error("Kayıt bu plazaya ait değil.");

  await prisma.maintenancePlanEntry.update({ where: { id }, data });

  revalidatePath("/maintenance-costs");
  revalidatePath("/");
  redirect("/maintenance-costs");
}

export async function deleteMaintenancePlanEntry(id: string) {
  const session = await auth();
  if (!session?.user || !canDelete(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  const plaza = await getSelectedPlaza();

  await prisma.maintenancePlanEntry.deleteMany({ where: { id, machine: { plazaId: plaza.id } } });

  revalidatePath("/maintenance-costs");
  revalidatePath("/");
}

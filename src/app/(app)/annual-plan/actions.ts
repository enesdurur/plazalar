"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";

export async function togglePlanWeekEntry(itemId: string, year: number, week: number) {
  const session = await auth();
  if (!session?.user || !canWrite(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  const plaza = await getSelectedPlaza();
  const item = await prisma.maintenancePlanItem.findFirst({
    where: { id: itemId, plazaId: plaza.id },
  });
  if (!item) throw new Error("Bakım kalemi bu plazaya ait değil.");
  if (!item.scheduledWeeks.includes(week)) {
    throw new Error("Bu hafta bu kalem için planlanmamış.");
  }

  const existing = await prisma.maintenancePlanWeekEntry.findUnique({
    where: { itemId_year_week: { itemId, year, week } },
  });

  // Cycle: boş (null) -> yapıldı (true) -> yapılmadı (false) -> boş (null)
  const next = existing?.completed === true ? false : existing?.completed === false ? null : true;

  await prisma.maintenancePlanWeekEntry.upsert({
    where: { itemId_year_week: { itemId, year, week } },
    update: { completed: next },
    create: { itemId, year, week, completed: next },
  });

  revalidatePath("/annual-plan");
  revalidatePath("/");
}

const costSchema = z.object({
  cost: z.coerce.number().optional(),
  costCurrency: z.enum(["TRY", "USD", "EUR"]).default("TRY"),
  note: z.string().optional(),
  hasSparePart: z.boolean(),
  sparePartCost: z.coerce.number().optional(),
  sparePartCostCurrency: z.enum(["TRY", "USD", "EUR"]).default("TRY"),
  sparePartNote: z.string().optional(),
});

function emptyToUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

export async function updatePlanWeekEntryCost(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || !canWrite(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  const plaza = await getSelectedPlaza();

  const parsed = costSchema.parse({
    cost: emptyToUndefined(formData.get("cost")),
    costCurrency: emptyToUndefined(formData.get("costCurrency")) ?? "TRY",
    note: emptyToUndefined(formData.get("note")),
    hasSparePart: formData.get("hasSparePart") === "on",
    sparePartCost: emptyToUndefined(formData.get("sparePartCost")),
    sparePartCostCurrency: emptyToUndefined(formData.get("sparePartCostCurrency")) ?? "TRY",
    sparePartNote: emptyToUndefined(formData.get("sparePartNote")),
  });

  const { hasSparePart, ...rest } = parsed;

  await prisma.maintenancePlanWeekEntry.updateMany({
    where: { id, item: { plazaId: plaza.id } },
    data: {
      cost: rest.cost,
      costCurrency: rest.costCurrency,
      note: rest.note,
      sparePartCost: hasSparePart ? rest.sparePartCost : null,
      sparePartCostCurrency: hasSparePart ? rest.sparePartCostCurrency : "TRY",
      sparePartNote: hasSparePart ? rest.sparePartNote : null,
    },
  });

  revalidatePath("/annual-plan");
  revalidatePath("/");
  revalidatePath("/maintenance-costs");
  redirect("/annual-plan");
}

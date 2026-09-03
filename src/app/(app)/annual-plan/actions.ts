"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canApprove, canAddAttachmentKind } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { recomputeAutoBudgetEntry } from "@/lib/budget/auto-sync";
import { monthOfWeek } from "@/lib/plan/weeks";
import { saveAttachment, removeAttachment, type AttachmentActionResult } from "@/lib/attachments/service";
import type { AttachmentKind } from "@prisma/client";

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
  costExchangeRate: z.coerce.number().positive().optional(),
  note: z.string().optional(),
  hasSparePart: z.boolean(),
  sparePartCost: z.coerce.number().optional(),
  sparePartCostCurrency: z.enum(["TRY", "USD", "EUR"]).default("TRY"),
  sparePartExchangeRate: z.coerce.number().positive().optional(),
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

  const existing = await prisma.maintenancePlanWeekEntry.findFirst({
    where: { id, item: { plazaId: plaza.id } },
  });
  if (!existing) throw new Error("Kayıt bu plazaya ait değil.");

  const parsed = costSchema.parse({
    cost: emptyToUndefined(formData.get("cost")),
    costCurrency: emptyToUndefined(formData.get("costCurrency")) ?? "TRY",
    costExchangeRate: emptyToUndefined(formData.get("costExchangeRate")),
    note: emptyToUndefined(formData.get("note")),
    hasSparePart: formData.get("hasSparePart") === "on",
    sparePartCost: emptyToUndefined(formData.get("sparePartCost")),
    sparePartCostCurrency: emptyToUndefined(formData.get("sparePartCostCurrency")) ?? "TRY",
    sparePartExchangeRate: emptyToUndefined(formData.get("sparePartExchangeRate")),
    sparePartNote: emptyToUndefined(formData.get("sparePartNote")),
  });

  const { hasSparePart, ...rest } = parsed;

  await prisma.maintenancePlanWeekEntry.update({
    where: { id: existing.id },
    data: {
      cost: rest.cost,
      costCurrency: rest.costCurrency,
      costExchangeRate: rest.costCurrency === "TRY" ? null : (rest.costExchangeRate ?? null),
      note: rest.note,
      sparePartCost: hasSparePart ? rest.sparePartCost : null,
      sparePartCostCurrency: hasSparePart ? rest.sparePartCostCurrency : "TRY",
      sparePartExchangeRate:
        hasSparePart && rest.sparePartCostCurrency !== "TRY"
          ? (rest.sparePartExchangeRate ?? null)
          : null,
      sparePartNote: hasSparePart ? rest.sparePartNote : null,
      // Maliyet her düzenlendiğinde yeniden Yönetim Müdürü onayına düşer.
      approved: false,
      approvedById: null,
      approvedAt: null,
    },
  });

  await recomputeAutoBudgetEntry(plaza.id, existing.year, monthOfWeek(existing.week), "MAINTENANCE_PLAN");

  revalidatePath("/annual-plan");
  revalidatePath("/");
  revalidatePath("/maintenance-costs");
  revalidatePath("/budget");
  revalidatePath("/budget/entry");
  revalidatePath("/other-expenses");
  redirect("/annual-plan");
}

export async function setPlanWeekEntryApproval(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || !canApprove(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  const plaza = await getSelectedPlaza();

  const existing = await prisma.maintenancePlanWeekEntry.findFirst({
    where: { id, item: { plazaId: plaza.id } },
  });
  if (!existing) throw new Error("Kayıt bu plazaya ait değil.");

  const approved = formData.get("approved") === "true";

  await prisma.maintenancePlanWeekEntry.update({
    where: { id: existing.id },
    data: {
      approved,
      approvedById: approved ? session.user.id : null,
      approvedAt: approved ? new Date() : null,
    },
  });

  await recomputeAutoBudgetEntry(plaza.id, existing.year, monthOfWeek(existing.week), "MAINTENANCE_PLAN");

  revalidatePath("/annual-plan");
  revalidatePath("/");
  revalidatePath("/maintenance-costs");
  revalidatePath("/budget");
  revalidatePath("/budget/entry");
  revalidatePath("/other-expenses");
  revalidatePath(`/annual-plan/entries/${id}/edit`);
}

export async function uploadPlanWeekEntryAttachment(
  id: string,
  formData: FormData
): Promise<AttachmentActionResult> {
  try {
    const session = await auth();
    const kind = formData.get("kind") as AttachmentKind;
    if (!session?.user || !canAddAttachmentKind(session.user.role, kind)) {
      return { error: "Bu işlem için yetkiniz yok." };
    }
    const plaza = await getSelectedPlaza();

    const existing = await prisma.maintenancePlanWeekEntry.findFirst({
      where: { id, item: { plazaId: plaza.id } },
    });
    if (!existing) return { error: "Kayıt bu plazaya ait değil." };

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { error: "Lütfen bir dosya seçin." };
    }

    await saveAttachment({
      kind,
      file,
      target: { planWeekEntryId: id },
      uploaderId: session.user.id,
    });

    revalidatePath(`/annual-plan/entries/${id}/edit`);
    revalidatePath("/maintenance-costs");
    revalidatePath("/other-expenses");
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Yükleme başarısız oldu." };
  }
}

export async function deletePlanWeekEntryAttachment(
  entryId: string,
  attachmentId: string
): Promise<AttachmentActionResult> {
  try {
    const session = await auth();
    const plaza = await getSelectedPlaza();

    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, planWeekEntry: { id: entryId, item: { plazaId: plaza.id } } },
    });
    if (!attachment) return { error: "Belge bulunamadı." };
    if (!session?.user || !canAddAttachmentKind(session.user.role, attachment.kind)) {
      return { error: "Bu işlem için yetkiniz yok." };
    }

    await removeAttachment(attachmentId);

    revalidatePath(`/annual-plan/entries/${entryId}/edit`);
    revalidatePath("/maintenance-costs");
    revalidatePath("/other-expenses");
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Silme başarısız oldu." };
  }
}

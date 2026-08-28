"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";

const schema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Ekipman adı zorunludur"),
  brand: z.string().optional(),
  reportNo: z.coerce.number().int().optional(),
  period: z.string().optional(),
  technicalFeature: z.string().optional(),
  inspectionDate: z.string().optional(),
  nextInspectionDate: z.string().optional(),
  location: z.string().optional(),
  responsiblePerson: z.string().optional(),
  cost: z.coerce.number().optional(),
  costCurrency: z.enum(["TRY", "USD", "EUR"]).default("TRY"),
});

function emptyToUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

function parseForm(formData: FormData) {
  const parsed = schema.parse({
    code: emptyToUndefined(formData.get("code")),
    name: formData.get("name"),
    brand: emptyToUndefined(formData.get("brand")),
    reportNo: emptyToUndefined(formData.get("reportNo")),
    period: emptyToUndefined(formData.get("period")),
    technicalFeature: emptyToUndefined(formData.get("technicalFeature")),
    inspectionDate: emptyToUndefined(formData.get("inspectionDate")),
    nextInspectionDate: emptyToUndefined(formData.get("nextInspectionDate")),
    location: emptyToUndefined(formData.get("location")),
    responsiblePerson: emptyToUndefined(formData.get("responsiblePerson")),
    cost: emptyToUndefined(formData.get("cost")),
    costCurrency: emptyToUndefined(formData.get("costCurrency")) ?? "TRY",
  });

  return {
    ...parsed,
    inspectionDate: parsed.inspectionDate ? new Date(parsed.inspectionDate) : undefined,
    nextInspectionDate: parsed.nextInspectionDate
      ? new Date(parsed.nextInspectionDate)
      : undefined,
  };
}

async function requireWriteAccess() {
  const session = await auth();
  if (!session?.user || !canWrite(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
}

export async function createInspection(formData: FormData) {
  await requireWriteAccess();
  const plaza = await getSelectedPlaza();
  const data = parseForm(formData);

  await prisma.periodicInspection.create({ data: { ...data, plazaId: plaza.id } });

  revalidatePath("/inspections");
  revalidatePath("/");
  redirect("/inspections");
}

export async function updateInspection(id: string, formData: FormData) {
  await requireWriteAccess();
  const plaza = await getSelectedPlaza();
  const data = parseForm(formData);

  await prisma.periodicInspection.updateMany({ where: { id, plazaId: plaza.id }, data });

  revalidatePath("/inspections");
  revalidatePath("/");
  redirect("/inspections");
}

export async function deleteInspection(id: string) {
  const session = await auth();
  if (!session?.user || !canDelete(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  const plaza = await getSelectedPlaza();

  await prisma.periodicInspection.deleteMany({ where: { id, plazaId: plaza.id } });
  revalidatePath("/inspections");
  revalidatePath("/");
}

export async function toggleInspectionWeekEntry(itemId: string, year: number, week: number) {
  const session = await auth();
  if (!session?.user || !canWrite(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  const plaza = await getSelectedPlaza();
  const item = await prisma.inspectionPlanItem.findFirst({
    where: { id: itemId, plazaId: plaza.id },
  });
  if (!item) throw new Error("Fenni muayene kalemi bu plazaya ait değil.");

  const existing = await prisma.inspectionPlanWeekEntry.findUnique({
    where: { itemId_year_week: { itemId, year, week } },
  });

  // Cycle: boş (null) -> yapıldı (true) -> yapılmadı (false) -> boş (null)
  const next = existing?.completed === true ? false : existing?.completed === false ? null : true;

  await prisma.inspectionPlanWeekEntry.upsert({
    where: { itemId_year_week: { itemId, year, week } },
    update: { completed: next },
    create: { itemId, year, week, completed: next },
  });

  revalidatePath("/inspections");
  revalidatePath("/");
}

const inspectionCostSchema = z.object({
  cost: z.coerce.number().optional(),
  costCurrency: z.enum(["TRY", "USD", "EUR"]).default("TRY"),
  note: z.string().optional(),
});

export async function updateInspectionWeekEntryCost(id: string, formData: FormData) {
  await requireWriteAccess();
  const plaza = await getSelectedPlaza();

  const data = inspectionCostSchema.parse({
    cost: emptyToUndefined(formData.get("cost")),
    costCurrency: emptyToUndefined(formData.get("costCurrency")) ?? "TRY",
    note: emptyToUndefined(formData.get("note")),
  });

  await prisma.inspectionPlanWeekEntry.updateMany({
    where: { id, item: { plazaId: plaza.id } },
    data,
  });

  revalidatePath("/inspections");
  revalidatePath("/");
  redirect("/inspections");
}

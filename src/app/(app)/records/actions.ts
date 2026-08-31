"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { recomputeAutoBudgetEntry } from "@/lib/budget/auto-sync";

const OTHER_SPARE_PART = "__other__";

const recordSchema = z.object({
  machineId: z.string().min(1, "Makine seçimi zorunludur"),
  operationType: z.enum(["ARIZA", "BAKIM"]),
  issueTypeId: z.string().optional(),
  description: z.string().min(1, "Açıklama zorunludur"),
  technicianId: z.string().optional(),
  reportedAt: z.string().min(1, "Bildirim zamanı zorunludur"),
  respondedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  sparePartId: z.string().optional(),
  sparePartOtherName: z.string().optional(),
  sparePartQty: z.coerce.number().int().optional(),
  sparePartCost: z.coerce.number().optional(),
  sparePartCostCurrency: z.enum(["TRY", "USD", "EUR"]).default("TRY"),
  sparePartExchangeRate: z.coerce.number().positive().optional(),
});

function emptyToUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

function parseRecordForm(formData: FormData) {
  const parsed = recordSchema.parse({
    machineId: formData.get("machineId"),
    operationType: formData.get("operationType"),
    issueTypeId: emptyToUndefined(formData.get("issueTypeId")),
    description: formData.get("description"),
    technicianId: emptyToUndefined(formData.get("technicianId")),
    reportedAt: formData.get("reportedAt"),
    respondedAt: emptyToUndefined(formData.get("respondedAt")),
    finishedAt: emptyToUndefined(formData.get("finishedAt")),
    sparePartId: emptyToUndefined(formData.get("sparePartId")),
    sparePartOtherName: emptyToUndefined(formData.get("sparePartOtherName")),
    sparePartQty: emptyToUndefined(formData.get("sparePartQty")),
    sparePartCost: emptyToUndefined(formData.get("sparePartCost")),
    sparePartCostCurrency: emptyToUndefined(formData.get("sparePartCostCurrency")) ?? "TRY",
    sparePartExchangeRate: emptyToUndefined(formData.get("sparePartExchangeRate")),
  });

  const isOther = parsed.sparePartId === OTHER_SPARE_PART;

  return {
    machineId: parsed.machineId,
    operationType: parsed.operationType,
    issueTypeId: parsed.issueTypeId,
    description: parsed.description,
    technicianId: parsed.technicianId,
    reportedAt: new Date(parsed.reportedAt),
    respondedAt: parsed.respondedAt ? new Date(parsed.respondedAt) : undefined,
    finishedAt: parsed.finishedAt ? new Date(parsed.finishedAt) : undefined,
    sparePartId: isOther ? undefined : parsed.sparePartId,
    sparePartOther: isOther ? parsed.sparePartOtherName : undefined,
    sparePartQty: parsed.sparePartQty,
    sparePartCost: parsed.sparePartCost,
    sparePartCostCurrency: parsed.sparePartCostCurrency,
    sparePartExchangeRate:
      parsed.sparePartCostCurrency !== "TRY" ? (parsed.sparePartExchangeRate ?? null) : null,
  };
}

async function requireWriteAccess() {
  const session = await auth();
  if (!session?.user || !canWrite(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  return session;
}

async function assertMachineInPlaza(machineId: string) {
  const plaza = await getSelectedPlaza();
  const machine = await prisma.machine.findFirst({
    where: { id: machineId, plazaId: plaza.id },
  });
  if (!machine) throw new Error("Makine bu plazaya ait değil.");
  return plaza;
}

async function recomputeFaultMonth(plazaId: string, date: Date) {
  await recomputeAutoBudgetEntry(plazaId, date.getFullYear(), date.getMonth() + 1, "FAULT_RECORDS");
}

export async function createRecord(formData: FormData) {
  const session = await requireWriteAccess();
  const data = parseRecordForm(formData);
  const plaza = await assertMachineInPlaza(data.machineId);

  await prisma.maintenanceRecord.create({
    data: { ...data, createdById: session.user.id },
  });

  await recomputeFaultMonth(plaza.id, data.reportedAt);

  revalidatePath("/records");
  revalidatePath("/");
  revalidatePath("/budget");
  revalidatePath("/budget/entry");
  redirect("/records");
}

export async function updateRecord(id: string, formData: FormData) {
  await requireWriteAccess();
  const data = parseRecordForm(formData);
  const plaza = await assertMachineInPlaza(data.machineId);

  const previous = await prisma.maintenanceRecord.findFirst({
    where: { id, machine: { plazaId: plaza.id } },
    select: { reportedAt: true },
  });

  await prisma.maintenanceRecord.updateMany({
    where: { id, machine: { plazaId: plaza.id } },
    data,
  });

  if (previous) await recomputeFaultMonth(plaza.id, previous.reportedAt);
  if (!previous || previous.reportedAt.getTime() !== data.reportedAt.getTime()) {
    await recomputeFaultMonth(plaza.id, data.reportedAt);
  }

  revalidatePath("/records");
  revalidatePath("/");
  revalidatePath("/budget");
  revalidatePath("/budget/entry");
  redirect("/records");
}

export async function deleteRecord(id: string) {
  const session = await auth();
  if (!session?.user || !canDelete(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  const plaza = await getSelectedPlaza();

  const existing = await prisma.maintenanceRecord.findFirst({
    where: { id, machine: { plazaId: plaza.id } },
    select: { reportedAt: true },
  });

  await prisma.maintenanceRecord.deleteMany({
    where: { id, machine: { plazaId: plaza.id } },
  });

  if (existing) await recomputeFaultMonth(plaza.id, existing.reportedAt);

  revalidatePath("/records");
  revalidatePath("/");
  revalidatePath("/budget");
  revalidatePath("/budget/entry");
}

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";

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
  sparePartQty: z.coerce.number().int().optional(),
  sparePartCost: z.coerce.number().optional(),
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
    sparePartQty: emptyToUndefined(formData.get("sparePartQty")),
    sparePartCost: emptyToUndefined(formData.get("sparePartCost")),
  });

  return {
    machineId: parsed.machineId,
    operationType: parsed.operationType,
    issueTypeId: parsed.issueTypeId,
    description: parsed.description,
    technicianId: parsed.technicianId,
    reportedAt: new Date(parsed.reportedAt),
    respondedAt: parsed.respondedAt ? new Date(parsed.respondedAt) : undefined,
    finishedAt: parsed.finishedAt ? new Date(parsed.finishedAt) : undefined,
    sparePartId: parsed.sparePartId,
    sparePartQty: parsed.sparePartQty,
    sparePartCost: parsed.sparePartCost,
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

export async function createRecord(formData: FormData) {
  const session = await requireWriteAccess();
  const data = parseRecordForm(formData);
  await assertMachineInPlaza(data.machineId);

  await prisma.maintenanceRecord.create({
    data: { ...data, createdById: session.user.id },
  });

  revalidatePath("/records");
  revalidatePath("/");
  redirect("/records");
}

export async function updateRecord(id: string, formData: FormData) {
  await requireWriteAccess();
  const data = parseRecordForm(formData);
  const plaza = await assertMachineInPlaza(data.machineId);

  await prisma.maintenanceRecord.updateMany({
    where: { id, machine: { plazaId: plaza.id } },
    data,
  });

  revalidatePath("/records");
  revalidatePath("/");
  redirect("/records");
}

export async function deleteRecord(id: string) {
  const session = await auth();
  if (!session?.user || !canDelete(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  const plaza = await getSelectedPlaza();

  await prisma.maintenanceRecord.deleteMany({
    where: { id, machine: { plazaId: plaza.id } },
  });
  revalidatePath("/records");
  revalidatePath("/");
}

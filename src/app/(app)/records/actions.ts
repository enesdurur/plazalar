"use server";

import { z } from "zod";
import { parseOrThrow, zRequiredDateString } from "@/lib/form-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  canWrite,
  canDelete,
  canApprove,
  canAddAttachmentKind,
  canSetResponsibleCompany,
} from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { recomputeAutoBudgetEntry } from "@/lib/budget/auto-sync";
import { saveAttachment, removeAttachment, type AttachmentActionResult } from "@/lib/attachments/service";
import type { AttachmentKind, Role } from "@prisma/client";

const OTHER_SPARE_PART = "__other__";

const recordSchema = z.object({
  // Boş bırakılırsa "Genel İş" (makine/teçhizatla ilgisi olmayan iş, ör. izolasyon) olarak
  // kaydedilir — bkz. record-form.tsx.
  machineId: z.string().optional(),
  operationType: z.enum(["ARIZA", "BAKIM"]),
  issueTypeId: z.string().optional(),
  description: z.string().min(1, "Açıklama zorunludur"),
  technicianId: z.string().optional(),
  reportedAt: zRequiredDateString("Geçerli bir bildirim zamanı girin"),
  respondedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  sparePartId: z.string().optional(),
  sparePartOtherName: z.string().optional(),
  sparePartQty: z.coerce.number().int().optional(),
  sparePartCost: z.coerce.number().optional(),
  sparePartCostCurrency: z.enum(["TRY", "USD", "EUR"]).default("TRY"),
  sparePartExchangeRate: z.coerce.number().positive().optional(),
  responsibleCompany: z.enum(["KAPITAL", "BURGAZ"]).default("BURGAZ"),
});

function emptyToUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

function parseRecordForm(formData: FormData) {
  const parsed = parseOrThrow(recordSchema, {
    machineId: emptyToUndefined(formData.get("machineId")),
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
    responsibleCompany: emptyToUndefined(formData.get("responsibleCompany")) ?? "BURGAZ",
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
    responsibleCompany: parsed.responsibleCompany,
  };
}

// Formdan gelen responsibleCompany'yi doğrudan güvenmeden, gönderen kullanıcının bu alanı
// değiştirme yetkisi yoksa (ör. TECHNICIAN) her zaman BURGAZ'a zorlar — tarayıcıdan formu
// manipüle ederek KAPITAL göndermeyi engeller (bkz. permissions.ts canSetResponsibleCompany).
function enforceResponsibleCompany<T extends { responsibleCompany: "KAPITAL" | "BURGAZ" }>(
  data: T,
  role: Role | undefined
): T {
  if (canSetResponsibleCompany(role)) return data;
  return { ...data, responsibleCompany: "BURGAZ" };
}

async function requireWriteAccess() {
  const session = await auth();
  if (!session?.user || !canWrite(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  return session;
}

// machineId boşsa (Genel İş) sadece seçili plazayı döner; doluysa makinenin gerçekten bu
// plazaya ait olduğunu doğrular.
async function resolvePlazaForRecord(machineId: string | undefined) {
  const plaza = await getSelectedPlaza();
  if (!machineId) return plaza;
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
  const data = enforceResponsibleCompany(parseRecordForm(formData), session.user.role);
  const plaza = await resolvePlazaForRecord(data.machineId);

  await prisma.maintenanceRecord.create({
    data: { ...data, machineId: data.machineId ?? null, plazaId: plaza.id, createdById: session.user.id },
  });

  await recomputeFaultMonth(plaza.id, data.reportedAt);

  revalidatePath("/records");
  revalidatePath("/");
  revalidatePath("/budget");
  revalidatePath("/budget/entry");
  revalidatePath("/other-expenses");
  redirect("/records");
}

export async function updateRecord(id: string, formData: FormData) {
  const session = await requireWriteAccess();
  const data = enforceResponsibleCompany(parseRecordForm(formData), session.user.role);
  const plaza = await resolvePlazaForRecord(data.machineId);

  const previous = await prisma.maintenanceRecord.findFirst({
    where: { id, plazaId: plaza.id },
    select: { reportedAt: true },
  });

  await prisma.maintenanceRecord.updateMany({
    where: { id, plazaId: plaza.id },
    // Maliyet her düzenlendiğinde yeniden Yönetim Müdürü onayına düşer.
    data: { ...data, machineId: data.machineId ?? null, approved: false, approvedById: null, approvedAt: null },
  });

  if (previous) await recomputeFaultMonth(plaza.id, previous.reportedAt);
  if (!previous || previous.reportedAt.getTime() !== data.reportedAt.getTime()) {
    await recomputeFaultMonth(plaza.id, data.reportedAt);
  }

  revalidatePath("/records");
  revalidatePath("/");
  revalidatePath("/budget");
  revalidatePath("/budget/entry");
  revalidatePath("/other-expenses");
  redirect("/records");
}

export async function deleteRecord(id: string) {
  const session = await auth();
  if (!session?.user || !canDelete(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  const plaza = await getSelectedPlaza();

  const existing = await prisma.maintenanceRecord.findFirst({
    where: { id, plazaId: plaza.id },
    select: { reportedAt: true },
  });

  await prisma.maintenanceRecord.deleteMany({
    where: { id, plazaId: plaza.id },
  });

  if (existing) await recomputeFaultMonth(plaza.id, existing.reportedAt);

  revalidatePath("/records");
  revalidatePath("/");
  revalidatePath("/budget");
  revalidatePath("/budget/entry");
  revalidatePath("/other-expenses");
}

export async function uploadRecordAttachment(
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

    const existing = await prisma.maintenanceRecord.findFirst({
      where: { id, plazaId: plaza.id },
    });
    if (!existing) return { error: "Kayıt bu plazaya ait değil." };

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { error: "Lütfen bir dosya seçin." };
    }

    await saveAttachment({
      kind,
      file,
      target: { maintenanceRecordId: id },
      uploaderId: session.user.id,
      plazaId: plaza.id,
    });

    revalidatePath(`/records/${id}/edit`);
    revalidatePath("/records");
    revalidatePath("/other-expenses");
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Yükleme başarısız oldu." };
  }
}

export async function deleteRecordAttachment(
  recordId: string,
  attachmentId: string
): Promise<AttachmentActionResult> {
  try {
    const session = await auth();
    const plaza = await getSelectedPlaza();

    const attachment = await prisma.attachment.findFirst({
      where: {
        id: attachmentId,
        maintenanceRecord: { id: recordId, plazaId: plaza.id },
      },
    });
    if (!attachment) return { error: "Belge bulunamadı." };
    if (!session?.user || !canAddAttachmentKind(session.user.role, attachment.kind)) {
      return { error: "Bu işlem için yetkiniz yok." };
    }

    await removeAttachment(attachmentId, plaza.id);

    revalidatePath(`/records/${recordId}/edit`);
    revalidatePath("/records");
    revalidatePath("/other-expenses");
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Silme başarısız oldu." };
  }
}

export async function setRecordApproval(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || !canApprove(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  const plaza = await getSelectedPlaza();

  const existing = await prisma.maintenanceRecord.findFirst({
    where: { id, plazaId: plaza.id },
    select: { reportedAt: true },
  });
  if (!existing) throw new Error("Kayıt bu plazaya ait değil.");

  const approved = formData.get("approved") === "true";

  await prisma.maintenanceRecord.updateMany({
    where: { id, plazaId: plaza.id },
    data: {
      approved,
      approvedById: approved ? session.user.id : null,
      approvedAt: approved ? new Date() : null,
    },
  });

  await recomputeFaultMonth(plaza.id, existing.reportedAt);

  revalidatePath("/records");
  revalidatePath("/");
  revalidatePath("/budget");
  revalidatePath("/budget/entry");
  revalidatePath("/other-expenses");
}

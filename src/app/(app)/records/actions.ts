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
const OTHER_ISSUE_TYPE = "__other__";

const recordSchema = z.object({
  // Boş bırakılırsa "Genel İş" (makine/teçhizatla ilgisi olmayan iş, ör. izolasyon) olarak
  // kaydedilir — bkz. record-form.tsx.
  machineId: z.string().optional(),
  operationType: z.enum(["ARIZA", "BAKIM"]),
  // Kategori artık çoklu seçim — bkz. issue-type-field.tsx.
  issueTypeIds: z.array(z.string()).optional(),
  issueTypeOtherName: z.string().optional(),
  // İş Süreci (teklif) tablosunun başlığı — description'dan tamamen bağımsız, sadece Yeni
  // Kayıt formundan (quote-draft-field.tsx) gelir; Kayıt Düzenle'de ayrı bir action ile
  // güncellenir (bkz. updateWorkTitle).
  workTitle: z.string().optional(),
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
  // Bu kaydın maliyetinin Diğer Giderler'de hangi ayın bütçesine sayılacağı — boşsa
  // reportedAt'ın ayı kullanılır (bkz. src/lib/budget/auto-sync.ts sumSpareParts).
  budgetMonth: z.coerce.number().int().min(1).max(12).optional(),
});

function emptyToUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

function parseRecordForm(formData: FormData) {
  const parsed = parseOrThrow(recordSchema, {
    machineId: emptyToUndefined(formData.get("machineId")),
    operationType: formData.get("operationType"),
    issueTypeIds: formData.getAll("issueTypeIds").filter((v): v is string => typeof v === "string"),
    issueTypeOtherName: emptyToUndefined(formData.get("issueTypeOtherName")),
    workTitle: emptyToUndefined(formData.get("workTitle")),
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
    budgetMonth: emptyToUndefined(formData.get("budgetMonth")),
  });

  const isOther = parsed.sparePartId === OTHER_SPARE_PART;
  const isOtherIssueType = (parsed.issueTypeIds ?? []).includes(OTHER_ISSUE_TYPE);

  return {
    machineId: parsed.machineId,
    operationType: parsed.operationType,
    // "Diğer" onay kutusu diğer kategorilerle birlikte aynı issueTypeIds listesine
    // gönderiliyor — gerçek kategori id'lerinden ayrılır, ilişkiye dahil edilmez.
    issueTypeIds: (parsed.issueTypeIds ?? []).filter((id) => id !== OTHER_ISSUE_TYPE),
    issueTypeOther: isOtherIssueType ? (parsed.issueTypeOtherName ?? null) : null,
    workTitle: parsed.workTitle,
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
    budgetMonth: parsed.budgetMonth ?? null,
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

async function recomputeFaultMonth(plazaId: string, reportedAt: Date, budgetMonth: number | null) {
  // FAULT_RECORDS artık her zaman 0 döner (dormant) — yedek parça/İş Süreci maliyetleri
  // SPARE_PARTS kaynağı üzerinden "Mekanik/Elektrik ve Diğer Sarf Malzemeler/Yedek Parçalar"
  // kalemine akar (bkz. src/lib/budget/auto-sync.ts).
  await recomputeAutoBudgetEntry(plazaId, reportedAt.getFullYear(), reportedAt.getMonth() + 1, "FAULT_RECORDS");
  const month = budgetMonth ?? reportedAt.getMonth() + 1;
  await recomputeAutoBudgetEntry(plazaId, reportedAt.getFullYear(), month, "SPARE_PARTS");
}

// İş Süreci (teklif/ödeme/fatura) action'larının ortak plaza-scoping kontrolü — kaydın
// gerçekten seçili plazaya ait olduğunu doğrular, aksi halde reddeder.
async function assertRecordInPlaza(recordId: string) {
  const plaza = await getSelectedPlaza();
  const record = await prisma.maintenanceRecord.findFirst({
    where: { id: recordId, plazaId: plaza.id },
    select: { reportedAt: true, budgetMonth: true },
  });
  if (!record) throw new Error("Kayıt bu plazaya ait değil.");
  return { plaza, record };
}

export async function createRecord(formData: FormData) {
  const session = await requireWriteAccess();
  const data = enforceResponsibleCompany(parseRecordForm(formData), session.user.role);
  const plaza = await resolvePlazaForRecord(data.machineId);
  const { issueTypeIds, ...recordData } = data;

  const record = await prisma.maintenanceRecord.create({
    data: {
      ...recordData,
      machineId: data.machineId ?? null,
      plazaId: plaza.id,
      createdById: session.user.id,
      issueTypes: { connect: issueTypeIds.map((id) => ({ id })) },
    },
  });

  // Yeni Kayıt formundaki "İş Süreci" onay kutusu işaretlenip teklif satırları girildiyse
  // (bkz. quote-draft-field.tsx), kayıtla birlikte tek seferde oluşturulur.
  const quotesRaw = formData.get("quotesJson");
  if (typeof quotesRaw === "string" && quotesRaw.trim() && quotesRaw !== "[]") {
    let parsedQuotes: unknown;
    try {
      parsedQuotes = JSON.parse(quotesRaw);
    } catch {
      parsedQuotes = [];
    }
    if (Array.isArray(parsedQuotes)) {
      const rows = parsedQuotes
        .map((q) => quoteSchema.safeParse(q))
        .filter((r) => r.success)
        .map((r) => r.data);
      if (rows.length > 0) {
        await prisma.recordQuote.createMany({
          data: rows.map((q) => ({
            recordId: record.id,
            contractorName: q.contractorName,
            workItem: q.workItem || null,
            amount: q.amount,
            currency: q.currency,
            note: q.note || null,
          })),
        });
      }
    }
  }

  await recomputeFaultMonth(plaza.id, data.reportedAt, data.budgetMonth);

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
  const { issueTypeIds, ...recordData } = data;

  const previous = await prisma.maintenanceRecord.findFirst({
    where: { id, plazaId: plaza.id },
    select: { reportedAt: true, budgetMonth: true },
  });
  if (!previous) throw new Error("Kayıt bu plazaya ait değil.");

  // Kategori ilişkisi (many-to-many "set") updateMany ile desteklenmiyor — bu yüzden yukarıda
  // plaza sahipliği doğrulandıktan sonra doğrudan update kullanılıyor.
  await prisma.maintenanceRecord.update({
    where: { id },
    data: {
      ...recordData,
      machineId: data.machineId ?? null,
      issueTypes: { set: issueTypeIds.map((issueTypeId) => ({ id: issueTypeId })) },
      // Maliyet her düzenlendiğinde yeniden Yönetim Müdürü onayına düşer.
      approved: false,
      approvedById: null,
      approvedAt: null,
    },
  });

  await recomputeFaultMonth(plaza.id, previous.reportedAt, previous.budgetMonth);
  if (
    previous.reportedAt.getTime() !== data.reportedAt.getTime() ||
    previous.budgetMonth !== data.budgetMonth
  ) {
    await recomputeFaultMonth(plaza.id, data.reportedAt, data.budgetMonth);
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
    select: { reportedAt: true, budgetMonth: true },
  });

  await prisma.maintenanceRecord.deleteMany({
    where: { id, plazaId: plaza.id },
  });

  if (existing) await recomputeFaultMonth(plaza.id, existing.reportedAt, existing.budgetMonth);

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
    select: { reportedAt: true, budgetMonth: true },
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

  await recomputeFaultMonth(plaza.id, existing.reportedAt, existing.budgetMonth);

  revalidatePath("/records");
  revalidatePath("/");
  revalidatePath("/budget");
  revalidatePath("/budget/entry");
  revalidatePath("/other-expenses");
}

// ---------------------------------------------------------------------------------------
// İş Süreci: Teklif → İş Verme → Fatura → Ödeme (bkz. work-process-section.tsx)
// ---------------------------------------------------------------------------------------

// Kayıt Düzenle sayfasındaki teklif tablosunun başlığı — Açıklama alanından tamamen bağımsız,
// input blur olduğunda doğrudan (form olmadan) çağrılır.
export async function updateWorkTitle(recordId: string, title: string) {
  await requireWriteAccess();
  await assertRecordInPlaza(recordId);

  await prisma.maintenanceRecord.update({
    where: { id: recordId },
    data: { workTitle: title.trim() || null },
  });

  revalidatePath(`/records/${recordId}/edit`);
  revalidatePath(`/records/${recordId}`);
  revalidatePath("/records");
}

const quoteSchema = z.object({
  contractorName: z.string().min(1, "Firma adı zorunludur"),
  workItem: z.string().optional(),
  amount: z.coerce.number().positive("Geçerli bir tutar girin"),
  currency: z.enum(["TRY", "USD", "EUR"]).default("TRY"),
  note: z.string().optional(),
});

export async function addQuote(recordId: string, formData: FormData) {
  await requireWriteAccess();
  await assertRecordInPlaza(recordId);
  const data = parseOrThrow(quoteSchema, {
    contractorName: formData.get("contractorName"),
    workItem: emptyToUndefined(formData.get("workItem")),
    amount: formData.get("amount"),
    currency: emptyToUndefined(formData.get("currency")) ?? "TRY",
    note: emptyToUndefined(formData.get("note")),
  });

  await prisma.recordQuote.create({
    data: { recordId, ...data, workItem: data.workItem ?? null },
  });

  revalidatePath(`/records/${recordId}/edit`);
}

export async function deleteQuote(recordId: string, quoteId: string) {
  await requireWriteAccess();
  await assertRecordInPlaza(recordId);

  await prisma.recordQuote.deleteMany({ where: { id: quoteId, recordId } });

  revalidatePath(`/records/${recordId}/edit`);
}

export async function selectQuote(recordId: string, quoteId: string) {
  await requireWriteAccess();
  await assertRecordInPlaza(recordId);

  const quote = await prisma.recordQuote.findFirst({ where: { id: quoteId, recordId } });
  if (!quote) throw new Error("Teklif bulunamadı.");

  // Aynı iş kalemindeki (workItem) diğer teklifler seçimsiz bırakılır — farklı kalemler
  // birbirinden bağımsız kendi firmasını seçebilir (ör. Mekanik ve Elektrik ayrı firmalara
  // verilebilir).
  await prisma.$transaction([
    prisma.recordQuote.updateMany({
      where: { recordId, workItem: quote.workItem },
      data: { selected: false },
    }),
    prisma.recordQuote.update({ where: { id: quoteId }, data: { selected: true } }),
    // awardedContractor/awardedAmount kaydın kendisinde tek bir alan (iş kalemi başına değil)
    // — birden fazla iş kalemi seçiliyse en son seçilen firma/tutar görünür. Diğer Giderler'deki
    // "Firma" sütunu bu alanı gösterir (bkz. fault-invoice-table.tsx).
    prisma.maintenanceRecord.update({
      where: { id: recordId },
      data: {
        awardedContractor: quote.contractorName,
        awardedAmount: quote.amount,
        awardedCurrency: quote.currency,
      },
    }),
  ]);

  revalidatePath(`/records/${recordId}/edit`);
  revalidatePath("/other-expenses");
}

const awardSchema = z.object({
  awardedContractor: z.string().optional(),
  awardedAmount: z.coerce.number().optional(),
  awardedCurrency: z.enum(["TRY", "USD", "EUR"]).default("TRY"),
});

export async function updateAwardInfo(recordId: string, formData: FormData) {
  await requireWriteAccess();
  await assertRecordInPlaza(recordId);
  const data = parseOrThrow(awardSchema, {
    awardedContractor: emptyToUndefined(formData.get("awardedContractor")),
    awardedAmount: emptyToUndefined(formData.get("awardedAmount")),
    awardedCurrency: emptyToUndefined(formData.get("awardedCurrency")) ?? "TRY",
  });

  await prisma.maintenanceRecord.updateMany({
    where: { id: recordId },
    data: {
      awardedContractor: data.awardedContractor ?? null,
      awardedAmount: data.awardedAmount ?? null,
      awardedCurrency: data.awardedCurrency,
    },
  });

  revalidatePath(`/records/${recordId}/edit`);
}

const invoiceSchema = z.object({
  invoiceNo: z.string().optional(),
  invoiceAmount: z.coerce.number().optional(),
  invoiceCurrency: z.enum(["TRY", "USD", "EUR"]).default("TRY"),
  invoiceExchangeRate: z.coerce.number().positive().optional(),
  invoicedAt: z.string().optional(),
});

export async function updateInvoiceInfo(recordId: string, formData: FormData) {
  await requireWriteAccess();
  const { plaza, record } = await assertRecordInPlaza(recordId);
  const data = parseOrThrow(invoiceSchema, {
    invoiceNo: emptyToUndefined(formData.get("invoiceNo")),
    invoiceAmount: emptyToUndefined(formData.get("invoiceAmount")),
    invoiceCurrency: emptyToUndefined(formData.get("invoiceCurrency")) ?? "TRY",
    invoiceExchangeRate: emptyToUndefined(formData.get("invoiceExchangeRate")),
    invoicedAt: emptyToUndefined(formData.get("invoicedAt")),
  });

  await prisma.maintenanceRecord.updateMany({
    where: { id: recordId },
    data: {
      invoiceNo: data.invoiceNo ?? null,
      invoiceAmount: data.invoiceAmount ?? null,
      invoiceCurrency: data.invoiceCurrency,
      invoiceExchangeRate: data.invoiceCurrency !== "TRY" ? (data.invoiceExchangeRate ?? null) : null,
      invoicedAt: data.invoicedAt ? new Date(data.invoicedAt) : null,
      // Fatura tutarı sparePartCost ile aynı onay akışına tabi — düzenlendiğinde yeniden
      // Yönetim Müdürü onayına düşer.
      approved: false,
      approvedById: null,
      approvedAt: null,
    },
  });

  await recomputeFaultMonth(plaza.id, record.reportedAt, record.budgetMonth);

  revalidatePath(`/records/${recordId}/edit`);
  revalidatePath("/records");
  revalidatePath("/");
  revalidatePath("/budget");
  revalidatePath("/budget/entry");
  revalidatePath("/other-expenses");
}

const paymentSchema = z.object({
  amount: z.coerce.number().positive("Geçerli bir tutar girin"),
  currency: z.enum(["TRY", "USD", "EUR"]).default("TRY"),
  paidAt: zRequiredDateString("Geçerli bir ödeme tarihi girin"),
  note: z.string().optional(),
});

export async function addPayment(recordId: string, formData: FormData) {
  await requireWriteAccess();
  await assertRecordInPlaza(recordId);
  const data = parseOrThrow(paymentSchema, {
    amount: formData.get("amount"),
    currency: emptyToUndefined(formData.get("currency")) ?? "TRY",
    paidAt: formData.get("paidAt"),
    note: emptyToUndefined(formData.get("note")),
  });

  await prisma.recordPayment.create({
    data: {
      recordId,
      amount: data.amount,
      currency: data.currency,
      paidAt: new Date(data.paidAt),
      note: data.note,
    },
  });

  revalidatePath(`/records/${recordId}/edit`);
}

export async function deletePayment(recordId: string, paymentId: string) {
  await requireWriteAccess();
  await assertRecordInPlaza(recordId);

  await prisma.recordPayment.deleteMany({ where: { id: paymentId, recordId } });

  revalidatePath(`/records/${recordId}/edit`);
}

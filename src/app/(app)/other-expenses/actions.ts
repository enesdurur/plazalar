"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete, canApprove } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { SECTION_NAMES } from "@/lib/budget/calc";
import { recomputeOtherExpenseMonth } from "@/lib/budget/other-expense-sync";
import { saveAttachment, removeAttachment, type AttachmentActionResult } from "@/lib/attachments/service";

async function requireWriteAccess() {
  const session = await auth();
  if (!session?.user || !canWrite(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  return session;
}

async function requireDeleteAccess() {
  const session = await auth();
  if (!session?.user || !canDelete(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
}

// Bir kalemin gerçekten bu plazanın "DİĞER GİDERLER" bölümüne ait olduğunu doğrular — başka
// bir bölümdeki (Personel/Yönetim) veya başka bir plazanın kalemine kayıt eklenemez.
async function assertOtherExpenseLineItem(plazaId: string, lineItemId: string) {
  const item = await prisma.budgetLineItem.findFirst({
    where: { id: lineItemId, section: { plazaId, name: SECTION_NAMES.other } },
  });
  if (!item) throw new Error("Geçersiz kalem.");
  return item;
}

const otherExpenseSchema = z.object({
  lineItemId: z.string().min(1, "Kalem seçimi zorunludur"),
  month: z.coerce.number().int().min(1).max(12),
  amount: z.coerce.number().positive("Tutar sıfırdan büyük olmalıdır"),
  note: z.string().optional(),
});

function emptyToUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

function parseOtherExpenseForm(formData: FormData) {
  return otherExpenseSchema.parse({
    lineItemId: formData.get("lineItemId"),
    month: formData.get("month"),
    amount: formData.get("amount"),
    note: emptyToUndefined(formData.get("note")),
  });
}

export async function createOtherExpense(formData: FormData) {
  const session = await requireWriteAccess();
  const plaza = await getSelectedPlaza();
  const data = parseOtherExpenseForm(formData);
  await assertOtherExpenseLineItem(plaza.id, data.lineItemId);

  await prisma.otherExpenseEntry.create({
    data: {
      lineItemId: data.lineItemId,
      month: data.month,
      amount: data.amount,
      note: data.note ?? null,
      createdById: session.user.id,
    },
  });

  await recomputeOtherExpenseMonth(data.lineItemId, data.month);

  revalidatePath("/other-expenses");
  revalidatePath("/budget");
  redirect("/other-expenses");
}

export async function updateOtherExpense(id: string, formData: FormData) {
  await requireWriteAccess();
  const plaza = await getSelectedPlaza();
  const data = parseOtherExpenseForm(formData);
  await assertOtherExpenseLineItem(plaza.id, data.lineItemId);

  const previous = await prisma.otherExpenseEntry.findFirst({
    where: { id, lineItem: { section: { plazaId: plaza.id } } },
    select: { lineItemId: true, month: true },
  });
  if (!previous) notFound();

  await prisma.otherExpenseEntry.updateMany({
    where: { id, lineItem: { section: { plazaId: plaza.id } } },
    data: {
      lineItemId: data.lineItemId,
      month: data.month,
      amount: data.amount,
      note: data.note ?? null,
      // Tutar/kalem/ay her düzenlendiğinde yeniden bina yöneticisi onayına düşer.
      approved: false,
      approvedById: null,
      approvedAt: null,
    },
  });

  await recomputeOtherExpenseMonth(previous.lineItemId, previous.month);
  if (previous.lineItemId !== data.lineItemId || previous.month !== data.month) {
    await recomputeOtherExpenseMonth(data.lineItemId, data.month);
  }

  revalidatePath("/other-expenses");
  revalidatePath("/budget");
  redirect("/other-expenses");
}

export async function deleteOtherExpense(id: string) {
  await requireDeleteAccess();
  const plaza = await getSelectedPlaza();

  const existing = await prisma.otherExpenseEntry.findFirst({
    where: { id, lineItem: { section: { plazaId: plaza.id } } },
    select: { lineItemId: true, month: true },
  });
  if (!existing) return;

  await prisma.otherExpenseEntry.deleteMany({
    where: { id, lineItem: { section: { plazaId: plaza.id } } },
  });

  await recomputeOtherExpenseMonth(existing.lineItemId, existing.month);

  revalidatePath("/other-expenses");
  revalidatePath("/budget");
}

export async function setOtherExpenseApproval(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || !canApprove(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  const plaza = await getSelectedPlaza();

  const existing = await prisma.otherExpenseEntry.findFirst({
    where: { id, lineItem: { section: { plazaId: plaza.id } } },
    select: { lineItemId: true, month: true },
  });
  if (!existing) throw new Error("Kayıt bulunamadı.");

  const approved = formData.get("approved") === "true";

  await prisma.otherExpenseEntry.updateMany({
    where: { id, lineItem: { section: { plazaId: plaza.id } } },
    data: {
      approved,
      approvedById: approved ? session.user.id : null,
      approvedAt: approved ? new Date() : null,
    },
  });

  await recomputeOtherExpenseMonth(existing.lineItemId, existing.month);

  revalidatePath("/other-expenses");
  revalidatePath("/budget");
}

export async function uploadOtherExpenseAttachment(
  id: string,
  formData: FormData
): Promise<AttachmentActionResult> {
  try {
    const session = await auth();
    if (!session?.user || !canWrite(session.user.role)) {
      return { error: "Bu işlem için yetkiniz yok." };
    }
    const plaza = await getSelectedPlaza();

    const existing = await prisma.otherExpenseEntry.findFirst({
      where: { id, lineItem: { section: { plazaId: plaza.id } } },
    });
    if (!existing) return { error: "Kayıt bu plazaya ait değil." };

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { error: "Lütfen bir dosya seçin." };
    }

    await saveAttachment({
      kind: "INVOICE",
      file,
      target: { otherExpenseEntryId: id },
      uploaderId: session.user.id,
    });

    revalidatePath("/other-expenses");
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Yükleme başarısız oldu." };
  }
}

export async function deleteOtherExpenseAttachment(
  entryId: string,
  attachmentId: string
): Promise<AttachmentActionResult> {
  try {
    const session = await auth();
    if (!session?.user || !canWrite(session.user.role)) {
      return { error: "Bu işlem için yetkiniz yok." };
    }
    const plaza = await getSelectedPlaza();

    const attachment = await prisma.attachment.findFirst({
      where: {
        id: attachmentId,
        otherExpenseEntry: { id: entryId, lineItem: { section: { plazaId: plaza.id } } },
      },
    });
    if (!attachment) return { error: "Belge bulunamadı." };

    await removeAttachment(attachmentId);

    revalidatePath("/other-expenses");
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Silme başarısız oldu." };
  }
}

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { isLockedMonth } from "@/lib/budget/calc";

const SECTION_NAMES = [
  "A- PERSONEL GİDERLERİ",
  "YÖNETİM GİDERLERİ",
  "DİĞER GİDERLER",
] as const;
type SectionName = (typeof SECTION_NAMES)[number];

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
  return session;
}

async function getOrCreateSection(plazaId: string, year: number, name: SectionName) {
  return prisma.budgetSection.upsert({
    where: { plazaId_year_name: { plazaId, year, name } },
    update: {},
    create: { plazaId, year, name, sortOrder: SECTION_NAMES.indexOf(name) },
  });
}

const lineItemSchema = z.object({
  category: z.string().optional(),
  label: z.string().min(1, "Kalem adı zorunludur"),
  monthlyBudget: z.coerce.number().min(0),
  isFixedContract: z.coerce.boolean(),
  fixedAmount: z.coerce.number().min(0).optional(),
  fill: z.string().optional(),
});

function emptyToUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

function parseLineItemForm(formData: FormData) {
  return lineItemSchema.parse({
    category: emptyToUndefined(formData.get("category")),
    label: formData.get("label"),
    monthlyBudget: formData.get("monthlyBudget") || 0,
    isFixedContract: formData.get("isFixedContract") === "on",
    fixedAmount: emptyToUndefined(formData.get("fixedAmount")),
    fill: emptyToUndefined(formData.get("fill")),
  });
}

export async function createLineItem(sectionName: SectionName, year: number, formData: FormData) {
  await requireWriteAccess();
  const plaza = await getSelectedPlaza();
  const data = parseLineItemForm(formData);

  const section = await getOrCreateSection(plaza.id, year, sectionName);
  const count = await prisma.budgetLineItem.count({ where: { sectionId: section.id } });

  await prisma.budgetLineItem.create({
    data: {
      sectionId: section.id,
      category: data.category,
      label: data.label,
      monthlyBudget: data.monthlyBudget,
      isFixedContract: data.isFixedContract,
      fixedAmount: data.isFixedContract ? (data.fixedAmount ?? data.monthlyBudget) : undefined,
      sortOrder: count,
    },
  });

  revalidatePath("/budget");
  revalidatePath("/budget/setup");
  redirect(`/budget/setup?year=${year}`);
}

export async function updateLineItem(id: string, year: number, formData: FormData) {
  await requireWriteAccess();
  const plaza = await getSelectedPlaza();
  const data = parseLineItemForm(formData);

  const item = await prisma.budgetLineItem.findFirst({
    where: { id, section: { plazaId: plaza.id } },
  });
  if (!item) notFound();

  await prisma.budgetLineItem.update({
    where: { id },
    data: {
      category: data.category,
      label: data.label,
      monthlyBudget: data.monthlyBudget,
      isFixedContract: data.isFixedContract,
      fixedAmount: data.isFixedContract ? (data.fixedAmount ?? data.monthlyBudget) : null,
    },
  });

  revalidatePath("/budget");
  revalidatePath("/budget/setup");
  redirect(`/budget/setup?year=${year}`);
}

export async function deleteLineItem(id: string) {
  await requireDeleteAccess();
  const plaza = await getSelectedPlaza();

  await prisma.budgetLineItem.deleteMany({
    where: { id, section: { plazaId: plaza.id } },
  });

  revalidatePath("/budget");
  revalidatePath("/budget/setup");
}

async function assertLineItemInPlaza(lineItemId: string) {
  const plaza = await getSelectedPlaza();
  const item = await prisma.budgetLineItem.findFirst({
    where: { id: lineItemId, section: { plazaId: plaza.id } },
    include: { section: true },
  });
  if (!item) notFound();
  return item;
}

export async function toggleConfirmed(lineItemId: string, month: number) {
  await requireWriteAccess();
  const item = await assertLineItemInPlaza(lineItemId);
  if (isLockedMonth(item.section.year, month)) {
    throw new Error("Bu ay için veri kilitli, düzenlenemez.");
  }
  if (!item.isFixedContract) {
    throw new Error("Bu kalem sabit sözleşmeli değil.");
  }

  const existing = await prisma.budgetMonthEntry.findUnique({
    where: { lineItemId_month: { lineItemId, month } },
  });

  await prisma.budgetMonthEntry.upsert({
    where: { lineItemId_month: { lineItemId, month } },
    update: { confirmed: !(existing?.confirmed ?? false) },
    create: { lineItemId, month, confirmed: true },
  });

  revalidatePath("/budget");
  revalidatePath("/budget/entry");
}

export async function setManualAmount(lineItemId: string, month: number, formData: FormData) {
  await requireWriteAccess();
  const item = await assertLineItemInPlaza(lineItemId);
  if (isLockedMonth(item.section.year, month)) {
    throw new Error("Bu ay için veri kilitli, düzenlenemez.");
  }
  // Kalem sabit sözleşmeli olarak işaretlense bile, o ay için zaten elle girilmiş bir tutar
  // varsa düzenlenebilir/temizlenebilir kalır — sabitleme geçmiş veriyi kilitlemez.

  const raw = formData.get("amount");
  const amount =
    typeof raw === "string" && raw.trim() !== "" ? Math.max(0, Number(raw)) : null;
  if (amount !== null && Number.isNaN(amount)) {
    throw new Error("Geçersiz tutar.");
  }

  await prisma.budgetMonthEntry.upsert({
    where: { lineItemId_month: { lineItemId, month } },
    update: { manualAmount: amount },
    create: { lineItemId, month, manualAmount: amount },
  });

  revalidatePath("/budget");
  revalidatePath("/budget/entry");
}

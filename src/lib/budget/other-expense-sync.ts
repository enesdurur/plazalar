import { prisma } from "@/lib/prisma";
import { isLockedMonth } from "@/lib/budget/calc";

/**
 * Bir "Diğer Giderler" kaleminin belirli bir ayı için, onaylı (approved) OtherExpenseEntry
 * kayıtlarının toplamını BudgetMonthEntry.manualAmount'a yazar — Gerçekleşen Bütçe ve Veri
 * Girişi (Personel/Yönetim bölümleri) bu alanı zaten okuyor, başka bir değişiklik gerekmiyor.
 * Bir kalem+ay için birden fazla onaylı kayıt olabilir (aynı ay içinde birden fazla fatura).
 */
export async function recomputeOtherExpenseMonth(lineItemId: string, month: number) {
  const lineItem = await prisma.budgetLineItem.findUnique({
    where: { id: lineItemId },
    select: { section: { select: { year: true } } },
  });
  if (!lineItem) return;
  if (isLockedMonth(lineItem.section.year, month)) return;

  const entries = await prisma.otherExpenseEntry.findMany({
    where: { lineItemId, month, approved: true },
    select: { amount: true },
  });
  const total = entries.reduce((sum, e) => sum + Number(e.amount), 0);

  await prisma.budgetMonthEntry.upsert({
    where: { lineItemId_month: { lineItemId, month } },
    update: { manualAmount: total > 0 ? total : null },
    create: { lineItemId, month, manualAmount: total > 0 ? total : null },
  });
}

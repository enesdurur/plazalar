import { prisma } from "@/lib/prisma";
import { isLockedMonth } from "@/lib/budget/calc";
import { MONTH_WEEK_RANGES } from "@/lib/plan/weeks";
import type { BudgetAutoSource } from "@prisma/client";

/**
 * TL olmayan bir tutarı TL'ye çevirir. Kur girilmemişse null döner — bu durumda tutar
 * otomatik bütçe toplamına dahil edilmez (kur girilene kadar bekletilir).
 */
export function toTRY(amount: number, currency: string, exchangeRate: number | null): number | null {
  if (currency === "TRY") return amount;
  if (exchangeRate == null) return null;
  return amount * exchangeRate;
}

async function sumMaintenancePlan(plazaId: string, year: number, month: number) {
  const entries = await prisma.maintenancePlanWeekEntry.findMany({
    where: { year, item: { plazaId }, week: { in: weeksOfMonth(month) }, approved: true },
    select: {
      cost: true,
      costCurrency: true,
      costExchangeRate: true,
    },
  });

  let total = 0;
  for (const e of entries) {
    if (e.cost != null) {
      const tl = toTRY(Number(e.cost), e.costCurrency, e.costExchangeRate != null ? Number(e.costExchangeRate) : null);
      if (tl != null) total += tl;
    }
  }
  return total;
}

async function sumInspection(plazaId: string, year: number, month: number) {
  const entries = await prisma.inspectionPlanWeekEntry.findMany({
    where: { year, item: { plazaId }, week: { in: weeksOfMonth(month) }, approved: true },
    select: {
      cost: true,
      costCurrency: true,
      costExchangeRate: true,
    },
  });

  let total = 0;
  for (const e of entries) {
    if (e.cost != null) {
      const tl = toTRY(Number(e.cost), e.costCurrency, e.costExchangeRate != null ? Number(e.costExchangeRate) : null);
      if (tl != null) total += tl;
    }
  }
  return total;
}

// Arızalarda/bakımlarda ve fenni muayenelerde girilen yedek parça/sarf malzemesi maliyetleri
// artık "Bakım"/"Fenni Muayene" kalemlerine değil, tek bir birleşik "Mekanik/Elektrik ve Diğer
// Sarf Malzemeler/Yedek Parçalar" kalemine yansır — bkz. sumSpareParts. FAULT_RECORDS kaynağı
// bu yüzden artık hiçbir tutar üretmiyor (dormant); enum değeri ve fonksiyon, üretimde bu
// kaynağı kullanan bir kalem olması ihtimaline karşı (çift sayım oluşturmadan) geriye dönük
// uyumluluk için duruyor.
async function sumFaultRecords(_plazaId: string, _year: number, _month: number) {
  return 0;
}

async function sumSpareParts(plazaId: string, year: number, month: number) {
  let total = 0;

  const planEntries = await prisma.maintenancePlanWeekEntry.findMany({
    where: {
      year,
      item: { plazaId },
      week: { in: weeksOfMonth(month) },
      approved: true,
      sparePartCost: { not: null },
    },
    select: { sparePartCost: true, sparePartCostCurrency: true, sparePartExchangeRate: true },
  });
  for (const e of planEntries) {
    const tl = toTRY(
      Number(e.sparePartCost),
      e.sparePartCostCurrency,
      e.sparePartExchangeRate != null ? Number(e.sparePartExchangeRate) : null
    );
    if (tl != null) total += tl;
  }

  const inspectionEntries = await prisma.inspectionPlanWeekEntry.findMany({
    where: {
      year,
      item: { plazaId },
      week: { in: weeksOfMonth(month) },
      approved: true,
      sparePartCost: { not: null },
    },
    select: { sparePartCost: true, sparePartCostCurrency: true, sparePartExchangeRate: true },
  });
  for (const e of inspectionEntries) {
    const tl = toTRY(
      Number(e.sparePartCost),
      e.sparePartCostCurrency,
      e.sparePartExchangeRate != null ? Number(e.sparePartExchangeRate) : null
    );
    if (tl != null) total += tl;
  }

  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year + 1, 0, 1));
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 1));

  // BURGAZ sorumluluğundaki arıza kayıtlarının İş Süreci fatura tutarı — kaydın budgetMonth
  // override'ı doluysa o ay, boşsa reportedAt'ın ayı hedef alınır (yıl her zaman reportedAt'tan
  // gelir, bkz. schema.prisma MaintenanceRecord.budgetMonth).
  const records = await prisma.maintenanceRecord.findMany({
    where: {
      plazaId,
      operationType: "ARIZA",
      responsibleCompany: "BURGAZ",
      approved: true,
      invoiceAmount: { not: null },
      OR: [
        { budgetMonth: month, reportedAt: { gte: yearStart, lt: yearEnd } },
        { budgetMonth: null, reportedAt: { gte: monthStart, lt: monthEnd } },
      ],
    },
    select: { invoiceAmount: true, invoiceCurrency: true, invoiceExchangeRate: true },
  });
  for (const r of records) {
    const tl = toTRY(
      Number(r.invoiceAmount),
      r.invoiceCurrency ?? "TRY",
      r.invoiceExchangeRate != null ? Number(r.invoiceExchangeRate) : null
    );
    if (tl != null) total += tl;
  }

  return total;
}

// lib/plan/weeks.ts'deki 1-53 hafta numaralandırmasında bir ayın hangi haftalara denk
// geldiğini döner (yalnızca annual-plan/inspections modülleri bu numaralandırmayı kullanıyor).
function weeksOfMonth(month: number): number[] {
  const range = MONTH_WEEK_RANGES.find((r) => r.month === month);
  if (!range) return [];
  const weeks: number[] = [];
  for (let w = range.startWeek; w <= range.endWeek; w++) weeks.push(w);
  return weeks;
}

/**
 * Verilen plaza+yıl+ay için, autoSource'a bağlı bütçe kalemi varsa (ve bu ay kilitli
 * değilse) o kalemin BudgetMonthEntry.manualAmount'ını ilgili kaynaktan yeniden hesaplar.
 * Kalem yoksa veya ay kilitliyse (Ocak-Haziran 2026 Excel verisi) sessizce hiçbir şey yapmaz.
 */
export async function recomputeAutoBudgetEntry(
  plazaId: string,
  year: number,
  month: number,
  source: BudgetAutoSource
) {
  if (isLockedMonth(year, month)) return;

  const lineItem = await prisma.budgetLineItem.findFirst({
    where: { autoSource: source, section: { plazaId, year } },
  });
  if (!lineItem) return;

  const total =
    source === "MAINTENANCE_PLAN"
      ? await sumMaintenancePlan(plazaId, year, month)
      : source === "INSPECTION"
        ? await sumInspection(plazaId, year, month)
        : source === "SPARE_PARTS"
          ? await sumSpareParts(plazaId, year, month)
          : await sumFaultRecords(plazaId, year, month);

  await prisma.budgetMonthEntry.upsert({
    where: { lineItemId_month: { lineItemId: lineItem.id, month } },
    update: { manualAmount: total > 0 ? total : null },
    create: { lineItemId: lineItem.id, month, manualAmount: total > 0 ? total : null },
  });
}

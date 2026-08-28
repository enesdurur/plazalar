export interface RawMonthEntry {
  month: number;
  confirmed: boolean;
  manualAmount: number | null;
}

export interface RawLineItem {
  id: string;
  category: string | null;
  label: string;
  monthlyBudget: number;
  isFixedContract: boolean;
  fixedAmount: number | null;
  fill: string | null;
  entries: RawMonthEntry[];
}

export interface RawSection {
  name: string;
  items: RawLineItem[];
}

export interface ComputedRow {
  id?: string;
  category?: string | null;
  label: string;
  fill: string | null;
  /** Ocak (0) - Aralık (11) sırasıyla gerçekleşen tutar */
  actuals: number[];
  /** Geçen ay sayısına göre gerçekleşen toplam maliyet */
  realizedTotal: number;
  /** Aylık ortalama gerçekleşen maliyet */
  realizedAvg: number;
  /** Aylık taslak bütçe */
  monthlyBudget: number;
  /** Geçen ay sayısına göre taslak bütçe toplamı */
  budgetForPeriod: number;
  /** Taslak bütçe (yıllık) */
  budgetYearly: number;
  /** Sapma: pozitif = bütçe altında, negatif = bütçe üstünde */
  deviation: number;
}

/** Bugünün tarihine göre verilen yılda kaç ayın geçtiğini hesaplar (gelecek yıl -> 0, geçmiş yıl -> 12). */
export function elapsedMonths(year: number, now: Date = new Date()): number {
  if (year < now.getFullYear()) return 12;
  if (year > now.getFullYear()) return 0;
  return now.getMonth() + 1;
}

function realizedForMonth(item: RawLineItem, month: number): number {
  const entry = item.entries.find((e) => e.month === month);
  if (item.isFixedContract) {
    return entry?.confirmed ? Number(item.fixedAmount ?? 0) : 0;
  }
  return entry?.manualAmount != null ? Number(entry.manualAmount) : 0;
}

function computeRow(
  id: string | undefined,
  category: string | null | undefined,
  label: string,
  fill: string | null,
  monthlyBudget: number,
  actuals: number[],
  monthsElapsed: number
): ComputedRow {
  const counted = actuals.slice(0, monthsElapsed);
  const realizedTotal = counted.reduce((a, b) => a + b, 0);
  const budgetForPeriod = monthlyBudget * monthsElapsed;
  return {
    id,
    category,
    label,
    fill,
    actuals,
    realizedTotal,
    realizedAvg: monthsElapsed > 0 ? realizedTotal / monthsElapsed : 0,
    monthlyBudget,
    budgetForPeriod,
    budgetYearly: monthlyBudget * 12,
    deviation: realizedTotal > 0 && budgetForPeriod > 0 ? 1 - realizedTotal / budgetForPeriod : 0,
  };
}

function sumRows(
  rows: ComputedRow[],
  label: string,
  fill: string | null,
  monthsElapsed: number
): ComputedRow {
  const actuals = Array.from({ length: 12 }, (_, i) =>
    rows.reduce((sum, r) => sum + r.actuals[i], 0)
  );
  const monthlyBudget = rows.reduce((sum, r) => sum + r.monthlyBudget, 0);
  return computeRow(undefined, undefined, label, fill, monthlyBudget, actuals, monthsElapsed);
}

function mapLineItems(
  items: RawLineItem[],
  monthsElapsed: number,
  forcedCategory?: string
): ComputedRow[] {
  return items.map((item) => {
    const actuals = Array.from({ length: 12 }, (_, i) => realizedForMonth(item, i + 1));
    return computeRow(
      item.id,
      forcedCategory ?? item.category,
      item.label,
      item.fill,
      item.monthlyBudget,
      actuals,
      monthsElapsed
    );
  });
}

const SHARE_COUNT = 16000;
const MANAGEMENT_PROFIT_RATE = 0.07;

export interface ComputedLinkPlazaBudget {
  year: number;
  monthsElapsed: number;
  personnelRows: ComputedRow[];
  personnelTotal: ComputedRow;
  managementRows: ComputedRow[];
  managementTotal: ComputedRow;
  managementProfit: ComputedRow;
  managementGrandTotal: ComputedRow;
  personnelAndManagementTotal: ComputedRow;
  otherRows: ComputedRow[];
  otherTotal: ComputedRow;
  grandTotal: ComputedRow;
  periodSurplus: number;
  monthlyAvgSurplus: number;
}

const SECTION_NAMES = {
  personnel: "A- PERSONEL GİDERLERİ",
  management: "YÖNETİM GİDERLERİ",
  other: "DİĞER GİDERLER",
};

export function computeLinkPlazaBudget(
  sections: RawSection[],
  year: number,
  now: Date = new Date()
): ComputedLinkPlazaBudget {
  const monthsElapsed = elapsedMonths(year, now);
  const byName = new Map(sections.map((s) => [s.name, s]));

  const personnelRows = mapLineItems(
    byName.get(SECTION_NAMES.personnel)?.items ?? [],
    monthsElapsed
  );
  const personnelTotal = sumRows(
    personnelRows,
    "A- PERSONEL GİDERLERİ TOPLAM MALİYETİ",
    "#F8CBAD",
    monthsElapsed
  );

  const managementRows = mapLineItems(
    byName.get(SECTION_NAMES.management)?.items ?? [],
    monthsElapsed,
    "YÖNETİM GİDERLERİ"
  );
  const managementTotal = sumRows(
    managementRows,
    "YÖNETİM GİDERLERİ TOPLAM MALİYETİ",
    null,
    monthsElapsed
  );

  const profitBudget =
    Math.round(personnelTotal.monthlyBudget * MANAGEMENT_PROFIT_RATE * 100) / 100;
  const managementProfit = computeRow(
    undefined,
    undefined,
    "YÖNETİM KARI",
    null,
    profitBudget,
    Array.from({ length: 12 }, (_, i) => (i < monthsElapsed ? profitBudget : 0)),
    monthsElapsed
  );

  const managementGrandTotal = sumRows(
    [managementTotal, managementProfit],
    "B- YÖNETİM FİRMASI HİZMET BEDELİ + GENEL GİDER + YÖNETİM KARI",
    "#D9D9D9",
    monthsElapsed
  );

  const personnelAndManagementTotal = sumRows(
    [personnelTotal, managementGrandTotal],
    "A+B TOPLAM",
    "#FFC000",
    monthsElapsed
  );

  const otherRows = mapLineItems(
    byName.get(SECTION_NAMES.other)?.items ?? [],
    monthsElapsed,
    "DİĞER GİDERLER (Aylık Ortalama KDV Hariç Tutar)"
  );
  const otherTotal = sumRows(
    otherRows,
    "C- BİNA DİĞER GİDERLER TOPLAM MALİYETİ (KDV HARİÇ)",
    "#BFBFBF",
    monthsElapsed
  );

  const grandTotal = sumRows(
    [personnelAndManagementTotal, otherTotal],
    "A+B+C AİDATA ESAS ORTALAMA TOPLAM TUTAR (KDV HARİÇ)",
    "#FFC000",
    monthsElapsed
  );

  const periodSurplus = grandTotal.budgetForPeriod - grandTotal.realizedTotal;

  return {
    year,
    monthsElapsed,
    personnelRows,
    personnelTotal,
    managementRows,
    managementTotal,
    managementProfit,
    managementGrandTotal,
    personnelAndManagementTotal,
    otherRows,
    otherTotal,
    grandTotal,
    periodSurplus,
    monthlyAvgSurplus: monthsElapsed > 0 ? periodSurplus / monthsElapsed : 0,
  };
}

export { SHARE_COUNT };

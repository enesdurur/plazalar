export interface RawMonthEntry {
  month: number;
  confirmed: boolean;
  manualAmount: number | null;
}

export interface RawAdjustment {
  id: string;
  month: number;
  type: "OVERTIME" | "ABSENCE";
  label: string | null;
  amount: number;
}

export type BudgetAutoSourceValue = "MAINTENANCE_PLAN" | "INSPECTION" | "FAULT_RECORDS";

export interface RawLineItem {
  id: string;
  category: string | null;
  label: string;
  monthlyBudget: number;
  isFixedContract: boolean;
  fixedAmount: number | null;
  fill: string | null;
  autoSource: BudgetAutoSourceValue | null;
  entries: RawMonthEntry[];
  adjustments: RawAdjustment[];
}

export interface RawSection {
  name: string;
  items: RawLineItem[];
}

export interface AdjustmentDetail {
  label: string | null;
  amount: number;
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
  /** Ocak-Aralık: bu kalemin altındaki "Fazla Mesai" kırılımı (varsa) */
  overtimeByMonth?: number[];
  /** Ocak-Aralık: her ay için fazla mesai kırılımlarının tek tek (not + tutar) listesi */
  overtimeDetails?: AdjustmentDetail[][];
  /** Ocak-Aralık: bu kalemin altındaki "Eksik Çalışma" kırılımı (varsa) */
  absenceByMonth?: number[];
  /** Ocak-Aralık: her ay için eksik çalışma kırılımlarının tek tek (not + tutar) listesi */
  absenceDetails?: AdjustmentDetail[][];
}

/** Bugünün tarihine göre verilen yılda kaç ayın geçtiğini hesaplar (gelecek yıl -> 0, geçmiş yıl -> 12). */
export function elapsedMonths(year: number, now: Date = new Date()): number {
  if (year < now.getFullYear()) return 12;
  if (year > now.getFullYear()) return 0;
  return now.getMonth() + 1;
}

/** Ocak-Haziran 2026: Excel'den aktarılan, artık düzenlenemeyen geçmiş veri.
 * Temmuz 2026'dan itibaren veri girişi (onay kutusu / elle tutar) bu sistemden yapılıyor. */
export function isLockedMonth(year: number, month: number): boolean {
  return year === 2026 && month <= 6;
}

/** Fazla Mesai / Eksik Çalışma kırılımları yalnızca vardiyalı personel kadrolarında
 * (Güvenlik, Teknik, Temizlik, Bahçıvan) anlamlıdır — diğer kalemlerde gösterilmez. */
const ADJUSTMENT_CATEGORIES = new Set(["GÜVENLİK", "TEKNİK", "TEMİZLİK", "BAHÇE"]);

export function allowsAdjustments(category: string | null | undefined): boolean {
  if (!category) return false;
  return ADJUSTMENT_CATEGORIES.has(category.trim().toLocaleUpperCase("tr-TR"));
}

function monthBreakdown(
  item: RawLineItem,
  month: number
): { base: number; overtime: number; absence: number } {
  const entry = item.entries.find((e) => e.month === month);
  // Elle girilmiş bir tutar varsa (kalem sonradan sabit sözleşmeli olarak işaretlenmiş olsa
  // bile) o tutar korunur — sabit işaretlemek geçmiş ayların verisini sıfırlamaz. Onay kutusu
  // yalnızca henüz elle tutar girilmemiş aylarda geçerli olur.
  let base = 0;
  if (entry?.manualAmount != null) base = Number(entry.manualAmount);
  else if (item.isFixedContract) base = entry?.confirmed ? Number(item.fixedAmount ?? 0) : 0;

  let overtime = 0;
  let absence = 0;
  for (const a of item.adjustments) {
    if (a.month !== month) continue;
    if (a.type === "OVERTIME") overtime += a.amount;
    else absence += a.amount;
  }
  return { base, overtime, absence };
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
    const actuals: number[] = [];
    const overtimeByMonth: number[] = [];
    const absenceByMonth: number[] = [];
    const overtimeDetails: AdjustmentDetail[][] = [];
    const absenceDetails: AdjustmentDetail[][] = [];
    for (let m = 1; m <= 12; m++) {
      const { base, overtime, absence } = monthBreakdown(item, m);
      actuals.push(base + overtime - absence);
      overtimeByMonth.push(overtime);
      absenceByMonth.push(absence);
      const monthAdjustments = item.adjustments.filter((a) => a.month === m);
      overtimeDetails.push(
        monthAdjustments
          .filter((a) => a.type === "OVERTIME")
          .map((a) => ({ label: a.label, amount: a.amount }))
      );
      absenceDetails.push(
        monthAdjustments
          .filter((a) => a.type === "ABSENCE")
          .map((a) => ({ label: a.label, amount: a.amount }))
      );
    }
    const row = computeRow(
      item.id,
      forcedCategory ?? item.category,
      item.label,
      item.fill,
      item.monthlyBudget,
      actuals,
      monthsElapsed
    );
    if (overtimeByMonth.some((v) => v !== 0)) {
      row.overtimeByMonth = overtimeByMonth;
      row.overtimeDetails = overtimeDetails;
    }
    if (absenceByMonth.some((v) => v !== 0)) {
      row.absenceByMonth = absenceByMonth;
      row.absenceDetails = absenceDetails;
    }
    return row;
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

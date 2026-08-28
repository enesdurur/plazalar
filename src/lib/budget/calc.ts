import type { BudgetLineItem, BudgetQuarterData } from "./link-plaza-2026";

export interface ComputedRow {
  category?: string | null;
  label: string;
  fill: string | null;
  /** Girilen her ay için gerçekleşen tutar (tabloya yeni ay eklendikçe uzar) */
  actuals: number[];
  /** Girilen aylardaki gerçekleşen toplam maliyet */
  realizedTotal: number;
  /** Aylık ortalama gerçekleşen maliyet */
  realizedAvg: number;
  /** Aylık taslak bütçe */
  monthlyBudget: number;
  /** Girilen ay sayısına göre taslak bütçe toplamı */
  budgetForPeriod: number;
  /** Taslak bütçe (yıllık) */
  budgetYearly: number;
  /** Sapma: pozitif = bütçe altında, negatif = bütçe üstünde */
  deviation: number;
}

function computeRow(
  category: string | null | undefined,
  label: string,
  fill: string | null,
  monthlyBudget: number,
  actuals: number[]
): ComputedRow {
  const realizedTotal = actuals.reduce((a, b) => a + b, 0);
  const budgetForPeriod = monthlyBudget * actuals.length;
  return {
    category,
    label,
    fill,
    actuals,
    realizedTotal,
    realizedAvg: actuals.length > 0 ? realizedTotal / actuals.length : 0,
    monthlyBudget,
    budgetForPeriod,
    budgetYearly: monthlyBudget * 12,
    deviation: realizedTotal > 0 ? 1 - realizedTotal / budgetForPeriod : 0,
  };
}

function sumRows(rows: ComputedRow[], label: string, fill: string | null): ComputedRow {
  const monthCount = rows[0]?.actuals.length ?? 0;
  const actuals = Array.from({ length: monthCount }, (_, i) =>
    rows.reduce((sum, r) => sum + r.actuals[i], 0)
  );
  const monthlyBudget = rows.reduce((sum, r) => sum + r.monthlyBudget, 0);
  return computeRow(undefined, label, fill, monthlyBudget, actuals);
}

/** Excel'deki ayrı ayrı çeyrek sekmelerini (Ocak-Şubat-Mart, Nisan-Mayıs-Haziran, ...)
 * tek, sürekli büyüyebilen bir yıl görünümünde birleştirir. Yeni bir çeyrek/ay verisi
 * geldiğinde LINK_PLAZA_BUDGET_2026 dizisine eklemek yeterli; tablo otomatik uzar. */
function mergeLineItems(
  quarters: BudgetQuarterData[],
  pick: (q: BudgetQuarterData) => BudgetLineItem[],
  sectionCategory?: string
): ComputedRow[] {
  const rowSets = quarters.map(pick);
  const count = rowSets[0]?.length ?? 0;
  const rows: ComputedRow[] = [];
  for (let i = 0; i < count; i++) {
    const first = rowSets[0][i];
    const actuals = rowSets.flatMap((set) => set[i].months);
    const category = sectionCategory ? (i === 0 ? sectionCategory : null) : first.category;
    rows.push(computeRow(category, first.label, first.fill, first.monthlyBudget, actuals));
  }
  return rows;
}

const SHARE_COUNT = 16000;
const MANAGEMENT_PROFIT_RATE = 0.07;

export interface ComputedLinkPlazaBudget {
  monthNames: string[];
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
  fxLabels: string[];
  fxRates: number[];
  usdRealized: number[];
  usdPerShare: number[];
  periodSurplus: number;
  monthlyAvgSurplus: number;
}

export function computeLinkPlazaBudget(quarters: BudgetQuarterData[]): ComputedLinkPlazaBudget {
  const monthNames = quarters.flatMap((q) => q.monthNames);
  const fxLabels = quarters.flatMap((q) => q.fxLabels);
  const fxRates = quarters.flatMap((q) => q.fxRates);
  const monthCount = monthNames.length;

  const personnelRows = mergeLineItems(quarters, (q) => q.personnelRows);
  const personnelTotal = sumRows(personnelRows, "A- PERSONEL GİDERLERİ TOPLAM MALİYETİ", "#F8CBAD");

  const managementRows = mergeLineItems(quarters, (q) => q.managementRows, "YÖNETİM GİDERLERİ");
  const managementTotal = sumRows(managementRows, "YÖNETİM GİDERLERİ TOPLAM MALİYETİ", null);

  const profitBudget =
    Math.round(personnelTotal.monthlyBudget * MANAGEMENT_PROFIT_RATE * 100) / 100;
  const managementProfit = computeRow(
    undefined,
    "YÖNETİM KARI",
    null,
    profitBudget,
    Array.from({ length: monthCount }, () => profitBudget)
  );

  const managementGrandTotal = sumRows(
    [managementTotal, managementProfit],
    "B- YÖNETİM FİRMASI HİZMET BEDELİ + GENEL GİDER + YÖNETİM KARI",
    "#D9D9D9"
  );

  const personnelAndManagementTotal = sumRows(
    [personnelTotal, managementGrandTotal],
    "A+B TOPLAM",
    "#FFC000"
  );

  const otherRows = mergeLineItems(
    quarters,
    (q) => q.otherRows,
    "DİĞER GİDERLER\n(Aylık Ortalama KDV Hariç Tutar)"
  );
  const otherTotal = sumRows(
    otherRows,
    "C- BİNA DİĞER GİDERLER TOPLAM MALİYETİ (KDV HARİÇ)",
    "#BFBFBF"
  );

  const grandTotal = sumRows(
    [personnelAndManagementTotal, otherTotal],
    "A+B+C AİDATA ESAS ORTALAMA TOPLAM TUTAR (KDV HARİÇ)",
    "#FFC000"
  );

  const usdRealized = grandTotal.actuals.map((m, i) => m / fxRates[i]);
  const usdPerShare = usdRealized.map((u) => u / SHARE_COUNT);

  const periodSurplus = grandTotal.budgetForPeriod - grandTotal.realizedTotal;

  return {
    monthNames,
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
    fxLabels,
    fxRates,
    usdRealized,
    usdPerShare,
    periodSurplus,
    monthlyAvgSurplus: periodSurplus / monthCount,
  };
}

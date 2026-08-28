import type { BudgetLineItem, BudgetQuarterData } from "./link-plaza-2026";

export interface ComputedRow {
  category?: string | null;
  label: string;
  months: [number, number, number];
  /** H: 3 aylık gerçekleşen toplam maliyet */
  realizedTotal: number;
  /** I: aylık ortalama gerçekleşen maliyet */
  realizedAvg: number;
  /** K: aylık taslak bütçe */
  monthlyBudget: number;
  /** L: taslak bütçe (3 aylık) */
  budgetTotal: number;
  /** M: taslak bütçe (yıllık) */
  budgetYearly: number;
  /** N: 3 aylık sapma (pozitif = bütçe altında, negatif = bütçe üstünde) */
  deviation: number;
}

export function computeRow(row: BudgetLineItem): ComputedRow {
  const realizedTotal = row.months[0] + row.months[1] + row.months[2];
  const budgetTotal = row.monthlyBudget * 3;
  return {
    category: row.category,
    label: row.label,
    months: row.months,
    realizedTotal,
    realizedAvg: realizedTotal / 3,
    monthlyBudget: row.monthlyBudget,
    budgetTotal,
    budgetYearly: row.monthlyBudget * 12,
    deviation: realizedTotal > 0 ? 1 - realizedTotal / budgetTotal : 0,
  };
}

function sumLineItems(rows: ComputedRow[], label: string): BudgetLineItem {
  const months: [number, number, number] = [0, 0, 0];
  let monthlyBudget = 0;
  for (const r of rows) {
    months[0] += r.months[0];
    months[1] += r.months[1];
    months[2] += r.months[2];
    monthlyBudget += r.monthlyBudget;
  }
  return { label, months, monthlyBudget };
}

export interface ComputedBudgetQuarter {
  key: "q1" | "q2";
  title: string;
  monthNames: [string, string, string];
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
  fxLabels: [string, string, string];
  fxRates: [number, number, number];
  usdRealized: [number, number, number];
  usdPerShare: [number, number, number];
  quarterlySurplus: number;
  monthlyAvgSurplus: number;
}

const SHARE_COUNT = 16000;
const MANAGEMENT_PROFIT_RATE = 0.07;

export function computeBudgetQuarter(data: BudgetQuarterData): ComputedBudgetQuarter {
  const personnelRows = data.personnelRows.map(computeRow);
  const personnelTotal = computeRow(
    sumLineItems(personnelRows, "A- PERSONEL GİDERLERİ TOPLAM MALİYETİ")
  );

  const managementRows = data.managementRows.map(computeRow);
  const managementTotal = computeRow(
    sumLineItems(managementRows, "YÖNETİM GİDERLERİ TOPLAM MALİYETİ")
  );

  const profitBudget = Math.round(personnelTotal.monthlyBudget * MANAGEMENT_PROFIT_RATE * 100) / 100;
  const managementProfit = computeRow({
    label: "YÖNETİM KARI",
    months: [profitBudget, profitBudget, profitBudget],
    monthlyBudget: profitBudget,
  });

  const managementGrandTotal = computeRow(
    sumLineItems(
      [managementTotal, managementProfit],
      "B- YÖNETİM FİRMASI HİZMET BEDELİ + GENEL GİDER + YÖNETİM KARI"
    )
  );

  const personnelAndManagementTotal = computeRow(
    sumLineItems([personnelTotal, managementGrandTotal], "A+B TOPLAM")
  );

  const otherRows = data.otherRows.map(computeRow);
  const otherTotal = computeRow(
    sumLineItems(otherRows, "C- BİNA DİĞER GİDERLER TOPLAM MALİYETİ (KDV HARİÇ)")
  );

  const grandTotal = computeRow(
    sumLineItems(
      [personnelAndManagementTotal, otherTotal],
      "A+B+C AİDATA ESAS ORTALAMA TOPLAM TUTAR (KDV HARİÇ)"
    )
  );

  const usdRealized = grandTotal.months.map(
    (m, i) => m / data.fxRates[i]
  ) as [number, number, number];
  const usdPerShare = usdRealized.map((u) => u / SHARE_COUNT) as [number, number, number];

  const quarterlySurplus = grandTotal.budgetTotal - grandTotal.realizedTotal;

  return {
    key: data.key,
    title: data.title,
    monthNames: data.monthNames,
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
    fxLabels: data.fxLabels,
    fxRates: data.fxRates,
    usdRealized,
    usdPerShare,
    quarterlySurplus,
    monthlyAvgSurplus: quarterlySurplus / 3,
  };
}

import { Fragment } from "react";
import type { ComputedLinkPlazaBudget, ComputedRow } from "@/lib/budget/calc";

const MONTH_NAMES = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

function formatTL(n: number) {
  return `${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
}

function formatPercent(n: number) {
  return `${(n * 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function subRowCount(row: ComputedRow): number {
  return (row.overtimeByMonth ? 1 : 0) + (row.absenceByMonth ? 1 : 0);
}

/** Ardışık satırlarda aynı (boş olmayan) kategori tekrar ederse rowSpan ile birleştirilecek
 * şekilde 0 döndürür — Excel'deki sütun birleştirmelerinin karşılığı. Bir kalemin altında
 * Fazla Mesai/Eksik Çalışma alt satırları varsa, bunlar da rowSpan'a dahil edilir. */
function computeRowSpans(rows: ComputedRow[]): number[] {
  const spans = new Array(rows.length).fill(0);
  let i = 0;
  while (i < rows.length) {
    let j = i;
    let totalTrs = 0;
    do {
      totalTrs += 1 + subRowCount(rows[j]);
      j++;
    } while (j < rows.length && rows[j].category && rows[j].category === rows[i].category);
    spans[i] = totalTrs;
    i = j;
  }
  return spans;
}

export function BudgetView({ budget }: { budget: ComputedLinkPlazaBudget }) {
  const currentMonthIndex = budget.monthsElapsed - 1;

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full divide-y divide-slate-200 text-sm" style={{ minWidth: 900 + 12 * 130 }}>
          <thead className="bg-slate-100">
            <tr>
              <Th>HİZMET TÜRÜ</Th>
              <Th>HİZMET KADROSU</Th>
              {MONTH_NAMES.map((m, i) => (
                <Th
                  key={m}
                  highlight={i === currentMonthIndex}
                  muted={i > currentMonthIndex}
                >
                  {m}
                  {i === currentMonthIndex && (
                    <span className="ml-1 rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      bu ay
                    </span>
                  )}
                </Th>
              ))}
              <Th>GERÇEKLEŞEN TOPLAM</Th>
              <Th>AYLIK ORTALAMA GERÇEKLEŞEN</Th>
              <Th>TASLAK BÜTÇE (AYLIK)</Th>
              <Th>TASLAK BÜTÇE ({budget.monthsElapsed} AYLIK)</Th>
              <Th>TOPLAM MALİYET {budget.year} (YILLIK)</Th>
              <Th>SAPMA</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <GroupedRows rows={budget.personnelRows} currentMonthIndex={currentMonthIndex} />
            <TotalRow row={budget.personnelTotal} currentMonthIndex={currentMonthIndex} />

            <GroupedRows rows={budget.managementRows} currentMonthIndex={currentMonthIndex} />
            <TotalRow row={budget.managementTotal} currentMonthIndex={currentMonthIndex} />
            <TotalRow row={budget.managementProfit} currentMonthIndex={currentMonthIndex} />
            <TotalRow row={budget.managementGrandTotal} currentMonthIndex={currentMonthIndex} />
            <TotalRow
              row={budget.personnelAndManagementTotal}
              currentMonthIndex={currentMonthIndex}
            />

            <GroupedRows rows={budget.otherRows} currentMonthIndex={currentMonthIndex} />
            <TotalRow row={budget.otherTotal} currentMonthIndex={currentMonthIndex} />
            <TotalRow row={budget.grandTotal} currentMonthIndex={currentMonthIndex} />
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Bütçe Fazlası</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Dönem Bütçe Fazlası ({budget.monthsElapsed} ay)
            </p>
            <p
              className="mt-1 text-xl font-semibold tabular-nums"
              style={{
                color:
                  budget.periodSurplus >= 0
                    ? "var(--viz-status-good)"
                    : "var(--viz-status-critical)",
              }}
            >
              {formatTL(budget.periodSurplus)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Aylık Ortalama Bütçe Fazlası</p>
            <p
              className="mt-1 text-xl font-semibold tabular-nums"
              style={{
                color:
                  budget.monthlyAvgSurplus >= 0
                    ? "var(--viz-status-good)"
                    : "var(--viz-status-critical)",
              }}
            >
              {formatTL(budget.monthlyAvgSurplus)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Th({
  children,
  highlight = false,
  muted = false,
}: {
  children: React.ReactNode;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <th
      className={`whitespace-nowrap px-3 py-2.5 text-center text-xs font-bold ${
        highlight ? "bg-slate-200 text-slate-900" : muted ? "text-slate-400" : "text-slate-700"
      }`}
    >
      {children}
    </th>
  );
}

function GroupedRows({
  rows,
  currentMonthIndex,
}: {
  rows: ComputedRow[];
  currentMonthIndex: number;
}) {
  const spans = computeRowSpans(rows);
  return (
    <>
      {rows.map((r, i) => (
        <Fragment key={r.id ?? i}>
          <tr
            style={r.fill ? { backgroundColor: r.fill } : undefined}
            className={!r.fill ? "odd:bg-white even:bg-slate-50/60" : undefined}
          >
            {spans[i] > 0 && (
              <td
                rowSpan={spans[i]}
                className="whitespace-pre-wrap px-3 py-2 text-center align-middle text-slate-700"
              >
                {r.category}
              </td>
            )}
            <td className="whitespace-nowrap px-3 py-2 text-left text-slate-700">{r.label}</td>
            <DataCells row={r} currentMonthIndex={currentMonthIndex} />
          </tr>
          {r.overtimeByMonth && (
            <SubRow
              label="↳ Fazla Mesai"
              values={r.overtimeByMonth}
              positive
              currentMonthIndex={currentMonthIndex}
            />
          )}
          {r.absenceByMonth && (
            <SubRow
              label="↳ Eksik Çalışma"
              values={r.absenceByMonth}
              positive={false}
              currentMonthIndex={currentMonthIndex}
            />
          )}
        </Fragment>
      ))}
    </>
  );
}

function SubRow({
  label,
  values,
  positive,
  currentMonthIndex,
}: {
  label: string;
  values: number[];
  positive: boolean;
  currentMonthIndex: number;
}) {
  return (
    <tr className="bg-slate-50/40">
      <td colSpan={2} className="px-3 py-1 pl-8 text-left text-xs text-slate-500">
        {label}
      </td>
      {values.map((v, i) => {
        const future = i > currentMonthIndex;
        return (
          <td
            key={i}
            className={`whitespace-nowrap px-3 py-1 text-right text-xs tabular-nums ${
              future ? "text-slate-300" : positive ? "text-blue-600" : "text-red-600"
            }`}
          >
            {future && v === 0 ? "-" : v === 0 ? "-" : `${positive ? "+" : "-"}${formatTL(v)}`}
          </td>
        );
      })}
      <td colSpan={6} />
    </tr>
  );
}

function TotalRow({
  row,
  currentMonthIndex,
}: {
  row: ComputedRow;
  currentMonthIndex: number;
}) {
  return (
    <tr style={row.fill ? { backgroundColor: row.fill } : undefined}>
      <td colSpan={2} className="whitespace-pre-wrap px-3 py-2 text-left font-bold text-slate-900">
        {row.label}
      </td>
      <DataCells row={row} bold currentMonthIndex={currentMonthIndex} />
    </tr>
  );
}

function DataCells({
  row,
  bold = false,
  currentMonthIndex,
}: {
  row: ComputedRow;
  bold?: boolean;
  currentMonthIndex: number;
}) {
  return (
    <>
      {row.actuals.map((m, i) => {
        const future = i > currentMonthIndex;
        return (
          <td
            key={i}
            className={`whitespace-nowrap px-3 py-2 text-right tabular-nums ${
              future ? "text-slate-300" : bold ? "font-bold text-slate-900" : "text-slate-700"
            }`}
          >
            {future && m === 0 ? "-" : formatTL(m)}
          </td>
        );
      })}
      <Num value={row.realizedTotal} bold={bold} />
      <Num value={row.realizedAvg} bold={bold} />
      <Num value={row.monthlyBudget} bold={bold} />
      <Num value={row.budgetForPeriod} bold={bold} />
      <Num value={row.budgetYearly} bold={bold} />
      <td
        className={`whitespace-nowrap px-3 py-2 text-right tabular-nums ${bold ? "font-bold" : ""}`}
        style={{
          color: row.deviation >= 0 ? "var(--viz-status-good)" : "var(--viz-status-critical)",
        }}
      >
        {formatPercent(row.deviation)}
      </td>
    </>
  );
}

function Num({ value, bold }: { value: number; bold: boolean }) {
  return (
    <td
      className={`whitespace-nowrap px-3 py-2 text-right tabular-nums ${
        bold ? "font-bold text-slate-900" : "text-slate-700"
      }`}
    >
      {formatTL(value)}
    </td>
  );
}

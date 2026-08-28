import type { ComputedLinkPlazaBudget, ComputedRow } from "@/lib/budget/calc";

function formatTL(n: number) {
  return `${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
}

function formatUSD(n: number) {
  return `$${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(n: number) {
  return `${(n * 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function formatRate(n: number) {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

/** Aynı grubun ilk satırında kategori adını, sonraki satırlarda (category: null) rowSpan
 * ile birleştirilecek şekilde 0 döndürür — Excel'deki sütun birleştirmelerinin karşılığı. */
function computeRowSpans(rows: ComputedRow[]): number[] {
  const spans = new Array(rows.length).fill(0);
  let start = -1;
  rows.forEach((r, i) => {
    if (r.category !== null && r.category !== undefined) {
      start = i;
      spans[i] = 1;
    } else if (start >= 0) {
      spans[start]++;
    } else {
      spans[i] = 1;
    }
  });
  return spans;
}

export function BudgetView({ budget }: { budget: ComputedLinkPlazaBudget }) {
  const monthCount = budget.monthNames.length;

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full divide-y divide-slate-200 text-sm" style={{ minWidth: 900 + monthCount * 130 }}>
          <thead className="bg-slate-100">
            <tr>
              <Th>HİZMET TÜRÜ</Th>
              <Th>HİZMET KADROSU</Th>
              {budget.monthNames.map((m, i) => (
                <Th key={i} highlight={i === monthCount - 1}>
                  {m}
                  {i === monthCount - 1 && (
                    <span className="ml-1 rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      son ay
                    </span>
                  )}
                </Th>
              ))}
              <Th>GERÇEKLEŞEN TOPLAM</Th>
              <Th>AYLIK ORTALAMA GERÇEKLEŞEN</Th>
              <Th>TASLAK BÜTÇE (AYLIK)</Th>
              <Th>TASLAK BÜTÇE ({monthCount} AYLIK)</Th>
              <Th>TOPLAM MALİYET 2026 (YILLIK)</Th>
              <Th>SAPMA</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <GroupedRows rows={budget.personnelRows} />
            <TotalRow row={budget.personnelTotal} />

            <GroupedRows rows={budget.managementRows} />
            <TotalRow row={budget.managementTotal} />
            <TotalRow row={budget.managementProfit} />
            <TotalRow row={budget.managementGrandTotal} />
            <TotalRow row={budget.personnelAndManagementTotal} />

            <GroupedRows rows={budget.otherRows} />
            <TotalRow row={budget.otherTotal} />
            <TotalRow row={budget.grandTotal} />
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Dolar Bazında Gerçekleşen</h2>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1 font-medium"> </th>
                {budget.fxLabels.map((l) => (
                  <th key={l} className="py-1 text-right font-medium">
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-1.5 text-slate-600">Aybaşı Kur</td>
                {budget.fxRates.map((r, i) => (
                  <td key={i} className="py-1.5 text-right tabular-nums text-slate-900">
                    {formatRate(r)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-1.5 text-slate-600">USD Cinsinden Gerçekleşen</td>
                {budget.usdRealized.map((u, i) => (
                  <td key={i} className="py-1.5 text-right tabular-nums text-slate-900">
                    {formatUSD(u)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-1.5 text-slate-600">16.000 Hisse Oranına Göre Aidat (USD)</td>
                {budget.usdPerShare.map((u, i) => (
                  <td key={i} className="py-1.5 text-right tabular-nums text-slate-900">
                    {formatUSD(u)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Bütçe Fazlası</h2>
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Dönem Bütçe Fazlası ({monthCount} ay)
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
    </div>
  );
}

function Th({ children, highlight = false }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <th
      className={`whitespace-nowrap px-3 py-2.5 text-center text-xs font-bold text-slate-700 ${
        highlight ? "bg-slate-200" : ""
      }`}
    >
      {children}
    </th>
  );
}

function GroupedRows({ rows }: { rows: ComputedRow[] }) {
  const spans = computeRowSpans(rows);
  return (
    <>
      {rows.map((r, i) => (
        <tr key={i} style={r.fill ? { backgroundColor: r.fill } : undefined} className={!r.fill ? "odd:bg-white even:bg-slate-50/60" : undefined}>
          {spans[i] > 0 && (
            <td
              rowSpan={spans[i]}
              className="whitespace-pre-wrap px-3 py-2 text-center align-middle text-slate-700"
            >
              {r.category}
            </td>
          )}
          <td className="whitespace-nowrap px-3 py-2 text-left text-slate-700">{r.label}</td>
          <DataCells row={r} />
        </tr>
      ))}
    </>
  );
}

function TotalRow({ row }: { row: ComputedRow }) {
  return (
    <tr style={row.fill ? { backgroundColor: row.fill } : undefined}>
      <td colSpan={2} className="whitespace-pre-wrap px-3 py-2 text-left font-bold text-slate-900">
        {row.label}
      </td>
      <DataCells row={row} bold />
    </tr>
  );
}

function DataCells({ row, bold = false }: { row: ComputedRow; bold?: boolean }) {
  const numCls = `whitespace-nowrap px-3 py-2 text-right tabular-nums ${
    bold ? "font-bold text-slate-900" : "text-slate-700"
  }`;
  return (
    <>
      {row.actuals.map((m, i) => (
        <td key={i} className={numCls}>
          {formatTL(m)}
        </td>
      ))}
      <td className={numCls}>{formatTL(row.realizedTotal)}</td>
      <td className={numCls}>{formatTL(row.realizedAvg)}</td>
      <td className={numCls}>{formatTL(row.monthlyBudget)}</td>
      <td className={numCls}>{formatTL(row.budgetForPeriod)}</td>
      <td className={numCls}>{formatTL(row.budgetYearly)}</td>
      <td
        className={numCls}
        style={{
          color: row.deviation >= 0 ? "var(--viz-status-good)" : "var(--viz-status-critical)",
        }}
      >
        {formatPercent(row.deviation)}
      </td>
    </>
  );
}

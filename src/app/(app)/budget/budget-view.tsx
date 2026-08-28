"use client";

import { useState } from "react";
import type { ComputedBudgetQuarter, ComputedRow } from "@/lib/budget/calc";

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

export function BudgetView({ quarters }: { quarters: ComputedBudgetQuarter[] }) {
  const [activeKey, setActiveKey] = useState(quarters[0]?.key);
  const active = quarters.find((q) => q.key === activeKey) ?? quarters[0];

  if (!active) return null;

  return (
    <div>
      <div className="flex gap-2 print:hidden">
        {quarters.map((q) => (
          <button
            key={q.key}
            type="button"
            onClick={() => setActiveKey(q.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              q.key === active.key
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {q.title}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-[1400px] w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <Th>HİZMET TÜRÜ</Th>
              <Th>HİZMET KADROSU</Th>
              <Th align="right">{active.monthNames[0]}</Th>
              <Th align="right">{active.monthNames[1]}</Th>
              <Th align="right">{active.monthNames[2]}</Th>
              <Th align="right">3 AYLIK GERÇEKLEŞEN MALİYET</Th>
              <Th align="right">AYLIK ORTALAMA GERÇEKLEŞEN MALİYET</Th>
              <Th align="right">TASLAK BÜTÇE 2026 (AYLIK)</Th>
              <Th align="right">TASLAK BÜTÇE 2026 (3 AYLIK)</Th>
              <Th align="right">TOPLAM MALİYET 2026 (YILLIK)</Th>
              <Th align="right">3 AYLIK SAPMA</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <GroupedRows rows={active.personnelRows} />
            <TotalRow row={active.personnelTotal} highlight="subtotal" />

            <SectionLabel label="YÖNETİM GİDERLERİ" rowSpan={active.managementRows.length} rows={active.managementRows} />
            <TotalRow row={active.managementTotal} highlight="subtotal" />
            <TotalRow row={active.managementProfit} highlight="subtotal" />
            <TotalRow row={active.managementGrandTotal} highlight="subtotal" />
            <TotalRow row={active.personnelAndManagementTotal} highlight="total" />

            <SectionLabel
              label="DİĞER GİDERLER (Aylık Ortalama KDV Hariç)"
              rowSpan={active.otherRows.length}
              rows={active.otherRows}
            />
            <TotalRow row={active.otherTotal} highlight="subtotal" />
            <TotalRow row={active.grandTotal} highlight="grand" />
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Dolar Bazında Gerçekleşen</h2>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1 font-medium"> </th>
                {active.fxLabels.map((l) => (
                  <th key={l} className="py-1 text-right font-medium">
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-1.5 text-slate-600">Aybaşı Kur</td>
                {active.fxRates.map((r, i) => (
                  <td key={i} className="py-1.5 text-right tabular-nums text-slate-900">
                    {formatRate(r)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-1.5 text-slate-600">USD Cinsinden Gerçekleşen</td>
                {active.usdRealized.map((u, i) => (
                  <td key={i} className="py-1.5 text-right tabular-nums text-slate-900">
                    {formatUSD(u)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-1.5 text-slate-600">16.000 Hisse Oranına Göre Aidat (USD)</td>
                {active.usdPerShare.map((u, i) => (
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
              <p className="text-sm font-medium text-slate-500">3 Aylık Bütçe Fazlası</p>
              <p
                className="mt-1 text-xl font-semibold tabular-nums"
                style={{
                  color:
                    active.quarterlySurplus >= 0
                      ? "var(--viz-status-good)"
                      : "var(--viz-status-critical)",
                }}
              >
                {formatTL(active.quarterlySurplus)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Aylık Ortalama Bütçe Fazlası</p>
              <p
                className="mt-1 text-xl font-semibold tabular-nums"
                style={{
                  color:
                    active.monthlyAvgSurplus >= 0
                      ? "var(--viz-status-good)"
                      : "var(--viz-status-critical)",
                }}
              >
                {formatTL(active.monthlyAvgSurplus)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className={`whitespace-nowrap px-3 py-2.5 text-xs font-semibold text-slate-600 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function GroupedRows({ rows }: { rows: ComputedRow[] }) {
  return (
    <>
      {rows.map((r, i) => (
        <tr key={i} className="odd:bg-white even:bg-slate-50/60 hover:bg-slate-100">
          <td className="whitespace-nowrap px-3 py-2 text-slate-500">{r.category ?? ""}</td>
          <DataCells row={r} />
        </tr>
      ))}
    </>
  );
}

function SectionLabel({
  label,
  rowSpan,
  rows,
}: {
  label: string;
  rowSpan: number;
  rows: ComputedRow[];
}) {
  return (
    <>
      {rows.map((r, i) => (
        <tr key={i} className="odd:bg-white even:bg-slate-50/60 hover:bg-slate-100">
          {i === 0 && (
            <td rowSpan={rowSpan} className="whitespace-pre-wrap px-3 py-2 align-top text-slate-500">
              {label}
            </td>
          )}
          <DataCells row={r} />
        </tr>
      ))}
    </>
  );
}

function TotalRow({
  row,
  highlight,
}: {
  row: ComputedRow;
  highlight: "subtotal" | "total" | "grand";
}) {
  const bg =
    highlight === "grand"
      ? "bg-amber-100"
      : highlight === "total"
        ? "bg-amber-50"
        : "bg-slate-50";
  return (
    <tr className={bg}>
      <td colSpan={2} className="px-3 py-2 font-semibold text-slate-900">
        {row.label}
      </td>
      <DataCells row={row} bold />
    </tr>
  );
}

function DataCells({ row, bold = false }: { row: ComputedRow; bold?: boolean }) {
  const numCls = `whitespace-nowrap px-3 py-2 text-right tabular-nums ${
    bold ? "font-semibold text-slate-900" : "text-slate-700"
  }`;
  return (
    <>
      <td className={numCls}>{formatTL(row.months[0])}</td>
      <td className={numCls}>{formatTL(row.months[1])}</td>
      <td className={numCls}>{formatTL(row.months[2])}</td>
      <td className={numCls}>{formatTL(row.realizedTotal)}</td>
      <td className={numCls}>{formatTL(row.realizedAvg)}</td>
      <td className={numCls}>{formatTL(row.monthlyBudget)}</td>
      <td className={numCls}>{formatTL(row.budgetTotal)}</td>
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

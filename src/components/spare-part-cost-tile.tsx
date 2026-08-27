"use client";

import { useState } from "react";

const CURRENCY_LABELS: Record<string, string> = { TRY: "TL", USD: "USD", EUR: "EUR" };

function formatAmount(amount: number, currency: string) {
  return `${amount.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ${CURRENCY_LABELS[currency] ?? currency}`;
}

export type SparePartCostEntry = {
  id: string;
  machine: string;
  description: string;
  reportedAt: string;
  cost: number;
  currency: "TRY" | "USD" | "EUR";
};

export function SparePartCostTile({
  totals,
  entries,
}: {
  totals: { TRY: number; USD: number; EUR: number };
  entries: SparePartCostEntry[];
}) {
  const [open, setOpen] = useState(false);
  const hasEntries = entries.length > 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <button
        type="button"
        onClick={() => hasEntries && setOpen((v) => !v)}
        className="w-full text-left"
      >
        <p className="flex items-center gap-1 text-sm font-medium text-slate-500">
          Toplam Yedek Parça Maliyeti
          {hasEntries && <span className="text-slate-400">{open ? "▲" : "▼"}</span>}
        </p>
        <div className="mt-2 space-y-1">
          <p className="text-lg font-semibold tabular-nums text-slate-900">
            {formatAmount(totals.TRY, "TRY")}
          </p>
          {totals.USD > 0 && (
            <p className="text-lg font-semibold tabular-nums text-slate-900">
              {formatAmount(totals.USD, "USD")}
            </p>
          )}
          {totals.EUR > 0 && (
            <p className="text-lg font-semibold tabular-nums text-slate-900">
              {formatAmount(totals.EUR, "EUR")}
            </p>
          )}
        </div>
      </button>

      {open && (
        <div className="mt-3 max-h-56 space-y-2 overflow-y-auto border-t border-slate-100 pt-3">
          {entries.map((e) => (
            <div key={e.id} className="flex items-start justify-between gap-3 text-xs">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-700">{e.machine}</p>
                <p className="truncate text-slate-400">{e.description}</p>
                <p className="text-slate-400">{e.reportedAt}</p>
              </div>
              <p className="shrink-0 font-medium tabular-nums text-slate-700">
                {formatAmount(e.cost, e.currency)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

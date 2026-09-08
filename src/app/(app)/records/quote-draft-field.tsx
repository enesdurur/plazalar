"use client";

import { useState } from "react";

const OTHER_VALUE = "__other__";

type Currency = "TRY" | "USD" | "EUR";

interface DraftQuote {
  key: string;
  contractorName: string;
  workItem: string;
  workItemOther: string;
  amount: string;
  currency: Currency;
  note: string;
}

let counter = 0;
function nextKey() {
  counter += 1;
  return `draft-${counter}`;
}

function emptyRow(): DraftQuote {
  return {
    key: nextKey(),
    contractorName: "",
    workItem: "",
    workItemOther: "",
    amount: "",
    currency: "TRY",
    note: "",
  };
}

export function QuoteDraftField({ issueTypes }: { issueTypes: { id: string; name: string }[] }) {
  const [enabled, setEnabled] = useState(false);
  const [rows, setRows] = useState<DraftQuote[]>([emptyRow()]);

  function updateRow(key: string, patch: Partial<DraftQuote>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  const validRows = rows.filter((r) => r.contractorName.trim() && r.amount.trim());
  const payload = enabled
    ? validRows.map((r) => ({
        contractorName: r.contractorName.trim(),
        workItem: r.workItem === OTHER_VALUE ? r.workItemOther.trim() : r.workItem,
        amount: r.amount,
        currency: r.currency,
        note: r.note.trim() || undefined,
      }))
    : [];

  return (
    <div className="rounded-lg border-2 border-slate-300 bg-white shadow-sm">
      <label className="flex cursor-pointer select-none items-center gap-2 rounded-t-md bg-slate-50 px-5 py-3 text-base font-semibold text-slate-900">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4"
        />
        İş Süreci — Teklif Al
      </label>

      {enabled && (
        <div className="space-y-3 px-5 py-4">
          <p className="text-xs text-slate-500">
            Bu iş için topladığınız teklifleri aşağıya girin. Kayıt kaydedildikten sonra Kayıt
            Düzenle sayfasından daha fazla teklif ekleyebilir, birini seçebilirsiniz.
          </p>

          {rows.map((row) => (
            <div key={row.key} className="grid grid-cols-2 gap-3 rounded-md border border-slate-200 p-3 sm:grid-cols-5">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Firma Adı</span>
                <input
                  value={row.contractorName}
                  onChange={(e) => updateRow(row.key, { contractorName: e.target.value })}
                  className="input"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">İş Kalemi</span>
                <select
                  value={row.workItem}
                  onChange={(e) => updateRow(row.key, { workItem: e.target.value })}
                  className="input"
                >
                  <option value="">Seçiniz</option>
                  {issueTypes.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                  <option value={OTHER_VALUE}>Diğer (elle yazılacak)</option>
                </select>
                {row.workItem === OTHER_VALUE && (
                  <input
                    value={row.workItemOther}
                    onChange={(e) => updateRow(row.key, { workItemOther: e.target.value })}
                    placeholder="İş kalemi adı"
                    className="input mt-1"
                  />
                )}
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Tutar</span>
                <div className="flex gap-1">
                  <input
                    type="number"
                    step="0.01"
                    value={row.amount}
                    onChange={(e) => updateRow(row.key, { amount: e.target.value })}
                    className="input"
                  />
                  <select
                    value={row.currency}
                    onChange={(e) => updateRow(row.key, { currency: e.target.value as Currency })}
                    className="input w-20"
                  >
                    <option value="TRY">TL</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Not</span>
                <input
                  value={row.note}
                  onChange={(e) => updateRow(row.key, { note: e.target.value })}
                  className="input"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  className="text-xs font-medium text-red-600 hover:text-red-800"
                >
                  Satırı Sil
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setRows((prev) => [...prev, emptyRow()])}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            + Teklif Satırı Ekle
          </button>
        </div>
      )}

      <input type="hidden" name="quotesJson" value={JSON.stringify(payload)} />
    </div>
  );
}

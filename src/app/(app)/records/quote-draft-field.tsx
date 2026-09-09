"use client";

import { useState } from "react";
import { formatCostAmount } from "@/components/spare-part-cost-tile";

const OTHER_VALUE = "__other__";
const NO_WORK_ITEM = "__none__";

type Currency = "TRY" | "USD" | "EUR";

interface DraftQuote {
  key: string;
  contractorName: string;
  workItem: string;
  amount: number;
  currency: Currency;
  note: string;
}

let counter = 0;
function nextKey() {
  counter += 1;
  return `draft-${counter}`;
}

function groupByWorkItem(rows: DraftQuote[]) {
  const groups = new Map<string, DraftQuote[]>();
  for (const r of rows) {
    const key = r.workItem || NO_WORK_ITEM;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  return Array.from(groups.entries());
}

function AddQuoteForm({
  issueTypes,
  onAdd,
  onCancel,
}: {
  issueTypes: { id: string; name: string }[];
  onAdd: (row: Omit<DraftQuote, "key">) => void;
  onCancel: () => void;
}) {
  const [contractorName, setContractorName] = useState("");
  const [workItem, setWorkItem] = useState("");
  const [workItemOther, setWorkItemOther] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("TRY");
  const [note, setNote] = useState("");
  const isOther = workItem === OTHER_VALUE;

  function submit() {
    const amountNumber = Number(amount);
    if (!contractorName.trim() || !amount.trim() || !Number.isFinite(amountNumber) || amountNumber <= 0) {
      return;
    }
    onAdd({
      contractorName: contractorName.trim(),
      workItem: isOther ? workItemOther.trim() : workItem,
      amount: amountNumber,
      currency,
      note: note.trim(),
    });
    setContractorName("");
    setWorkItem("");
    setWorkItemOther("");
    setAmount("");
    setNote("");
  }

  return (
    <div className="grid grid-cols-2 gap-3 rounded-md border border-slate-200 p-3 sm:grid-cols-5">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Firma Adı</span>
        <input
          value={contractorName}
          onChange={(e) => setContractorName(e.target.value)}
          className="input"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">İş Kalemi</span>
        <select value={workItem} onChange={(e) => setWorkItem(e.target.value)} className="input">
          <option value="">Seçiniz</option>
          {issueTypes.map((t) => (
            <option key={t.id} value={t.name}>
              {t.name}
            </option>
          ))}
          <option value={OTHER_VALUE}>Diğer (elle yazılacak)</option>
        </select>
        {isOther && (
          <input
            value={workItemOther}
            onChange={(e) => setWorkItemOther(e.target.value)}
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
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input"
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
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
        <input value={note} onChange={(e) => setNote(e.target.value)} className="input" />
      </label>
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={submit}
          className="whitespace-nowrap rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
        >
          Ekle
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}

export function QuoteDraftField({ issueTypes }: { issueTypes: { id: string; name: string }[] }) {
  const [enabled, setEnabled] = useState(false);
  const [rows, setRows] = useState<DraftQuote[]>([]);
  const [addingOpen, setAddingOpen] = useState(true);

  function addRow(row: Omit<DraftQuote, "key">) {
    setRows((prev) => [...prev, { ...row, key: nextKey() }]);
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  const groups = groupByWorkItem(rows);
  const payload = enabled
    ? rows.map((r) => ({
        contractorName: r.contractorName,
        workItem: r.workItem || undefined,
        amount: String(r.amount),
        currency: r.currency,
        note: r.note || undefined,
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
        <div className="space-y-4 px-5 py-4">
          <p className="text-xs text-slate-500">
            Bu iş için topladığınız teklifleri aşağıya girin. Kayıt kaydedildikten sonra Kayıt
            Düzenle sayfasından daha fazla teklif ekleyebilir, birini seçebilirsiniz.
          </p>

          {groups.length > 0 && (
            <div className="space-y-4">
              {groups.map(([workItem, groupRows]) => (
                <div key={workItem}>
                  <h4 className="mb-1.5 text-sm font-semibold text-slate-800">
                    {workItem === NO_WORK_ITEM ? "İş Kalemi Belirtilmedi" : workItem}
                  </h4>
                  <div className="overflow-hidden rounded-md border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-3 py-2">Firma</th>
                          <th className="px-3 py-2">Tutar</th>
                          <th className="px-3 py-2">Not</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {groupRows.map((r) => (
                          <tr key={r.key}>
                            <td className="px-3 py-2 font-medium text-slate-900">
                              {r.contractorName}
                            </td>
                            <td className="px-3 py-2 tabular-nums text-slate-700">
                              {formatCostAmount(r.amount, r.currency)}
                            </td>
                            <td className="px-3 py-2 text-slate-500">{r.note || "-"}</td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => removeRow(r.key)}
                                className="text-xs font-medium text-red-600 hover:text-red-800"
                              >
                                Sil
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {addingOpen ? (
            <AddQuoteForm
              issueTypes={issueTypes}
              onAdd={(row) => {
                addRow(row);
                setAddingOpen(false);
              }}
              onCancel={() => setAddingOpen(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setAddingOpen(true)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              + İş Kalemi / Teklif Ekle
            </button>
          )}
        </div>
      )}

      <input type="hidden" name="quotesJson" value={JSON.stringify(payload)} />
    </div>
  );
}

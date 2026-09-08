"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { formatCostAmount } from "@/components/spare-part-cost-tile";
import { addQuote, deleteQuote, selectQuote } from "./actions";

const OTHER_VALUE = "__other__";

type Currency = "TRY" | "USD" | "EUR";

export interface QuoteInfo {
  id: string;
  contractorName: string;
  workItem: string | null;
  amount: number;
  currency: Currency;
  note: string | null;
  selected: boolean;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function SmallSubmit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="whitespace-nowrap rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
    >
      {pending ? "Kaydediliyor..." : children}
    </button>
  );
}

function WorkItemSelect({ issueTypes }: { issueTypes: { id: string; name: string }[] }) {
  const [selectValue, setSelectValue] = useState("");
  const [otherText, setOtherText] = useState("");
  const isOther = selectValue === OTHER_VALUE;

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">İş Kalemi</span>
      <select
        name={isOther ? undefined : "workItem"}
        value={selectValue}
        onChange={(e) => setSelectValue(e.target.value)}
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
      {isOther && (
        <input
          name="workItem"
          value={otherText}
          onChange={(e) => setOtherText(e.target.value)}
          placeholder="İş kalemi adı"
          className="input mt-1"
        />
      )}
    </label>
  );
}

export function WorkProcessSection({
  recordId,
  quotes,
  issueTypes,
}: {
  recordId: string;
  quotes: QuoteInfo[];
  issueTypes: { id: string; name: string }[];
}) {
  return (
    <details open className="mt-6 rounded-lg border-2 border-slate-300 bg-white shadow-sm">
      <summary className="cursor-pointer select-none rounded-t-md bg-slate-50 px-5 py-3 text-base font-semibold text-slate-900">
        İş Süreci — Teklifler
      </summary>

      <div className="space-y-6 border-t border-slate-200 px-5 py-5">
        <div>
          {quotes.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">İş Kalemi</th>
                    <th className="px-3 py-2">Firma</th>
                    <th className="px-3 py-2">Tutar</th>
                    <th className="px-3 py-2">Not</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotes.map((q) => (
                    <tr key={q.id} className={q.selected ? "bg-green-50" : undefined}>
                      <td className="px-3 py-2 text-slate-600">{q.workItem ?? "-"}</td>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {q.contractorName}
                        {q.selected && (
                          <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            Seçildi
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-slate-700">
                        {formatCostAmount(q.amount, q.currency)}
                      </td>
                      <td className="px-3 py-2 text-slate-500">{q.note ?? "-"}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-3">
                          {!q.selected && (
                            <form action={selectQuote.bind(null, recordId, q.id)}>
                              <button
                                type="submit"
                                className="text-xs font-medium text-slate-600 hover:text-slate-900"
                              >
                                Seç
                              </button>
                            </form>
                          )}
                          <form action={deleteQuote.bind(null, recordId, q.id)}>
                            <button
                              type="submit"
                              className="text-xs font-medium text-red-600 hover:text-red-800"
                            >
                              Sil
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Henüz teklif eklenmedi.</p>
          )}

          <form
            action={addQuote.bind(null, recordId)}
            className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5"
          >
            <Field label="Firma Adı">
              <input name="contractorName" required className="input" />
            </Field>
            <WorkItemSelect key={quotes.length} issueTypes={issueTypes} />
            <Field label="Tutar">
              <div className="flex gap-1">
                <input name="amount" type="number" step="0.01" required className="input" />
                <select name="currency" defaultValue="TRY" className="input w-20">
                  <option value="TRY">TL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </Field>
            <Field label="Not">
              <input name="note" className="input" />
            </Field>
            <div className="flex items-end">
              <SmallSubmit>Teklif Ekle</SmallSubmit>
            </div>
          </form>
        </div>
      </div>
    </details>
  );
}

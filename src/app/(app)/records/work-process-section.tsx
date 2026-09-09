"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { formatCostAmount } from "@/components/spare-part-cost-tile";
import { addQuote, deleteQuote, selectQuote, updateWorkTitle } from "./actions";

const OTHER_VALUE = "__other__";
const NO_WORK_ITEM = "İş Kalemi Belirtilmedi";

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

function WorkItemSelect({
  knownWorkItems,
  issueTypes,
}: {
  knownWorkItems: string[];
  issueTypes: { id: string; name: string }[];
}) {
  const [selectValue, setSelectValue] = useState("");
  const [otherText, setOtherText] = useState("");
  const isOther = selectValue === OTHER_VALUE;
  const options = Array.from(new Set([...knownWorkItems, ...issueTypes.map((t) => t.name)]));

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-600">İş Kalemi</span>
      <select
        name={isOther ? undefined : "workItem"}
        value={selectValue}
        onChange={(e) => setSelectValue(e.target.value)}
        className="input py-2.5 text-base"
      >
        <option value="">Seçiniz</option>
        {options.map((name) => (
          <option key={name} value={name}>
            {name}
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
          className="input mt-1 py-2.5 text-base"
        />
      )}
    </label>
  );
}

// Gönderilen örnek Excel'deki gibi (Maslak Square Plaza Baza Katı Duvar Örülmesi işi): satırlar
// iş kalemi (sabit), sütunlar teklif veren firmalar (kaç firma varsa o kadar sütun).
function pivotByWorkItem(quotes: QuoteInfo[]) {
  const workItems: string[] = [];
  const contractors: string[] = [];
  const cells = new Map<string, QuoteInfo>();
  const notes = new Map<string, string>();
  for (const q of quotes) {
    const wi = q.workItem ?? NO_WORK_ITEM;
    if (!workItems.includes(wi)) workItems.push(wi);
    if (!contractors.includes(q.contractorName)) contractors.push(q.contractorName);
    cells.set(`${wi}|${q.contractorName}`, q);
    if (!notes.has(wi) && q.note) notes.set(wi, q.note);
  }
  return { workItems, contractors, cells, notes };
}

export function WorkProcessSection({
  recordId,
  quotes,
  issueTypes,
  defaultTitle,
  readOnly = false,
}: {
  recordId: string;
  quotes: QuoteInfo[];
  issueTypes: { id: string; name: string }[];
  defaultTitle?: string | null;
  readOnly?: boolean;
}) {
  const [title, setTitle] = useState(defaultTitle ?? "");
  const [addingOpen, setAddingOpen] = useState(quotes.length === 0);
  const { workItems, contractors, cells, notes } = pivotByWorkItem(quotes);

  return (
    <details open className="mt-6 rounded-lg border-2 border-slate-300 bg-white shadow-sm">
      <summary className="cursor-pointer select-none rounded-t-md bg-slate-50 px-5 py-3 text-base font-semibold text-slate-900">
        İş Süreci — Teklifler
      </summary>

      <div className="space-y-5 border-t border-slate-200 px-5 py-5">
        {readOnly ? (
          <h3 className="w-full rounded-md border-2 border-[#2F5597] px-3 py-2 text-center text-sm font-bold text-slate-900">
            {title || "(Başlık girilmemiş)"}
          </h3>
        ) : (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              void updateWorkTitle(recordId, title);
            }}
            placeholder="Örn. Maslak Square Plaza Baza Katı Duvar Örülmesi ve Koridor Oluşturulması İşi"
            className="w-full rounded-md border-2 border-[#2F5597] px-3 py-2 text-center text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400"
          />
        )}

        {workItems.length > 0 ? (
          <div className="overflow-x-auto rounded-md border border-slate-300">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#D9D9D9] text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                  <th className="border border-slate-300 px-3 py-2">İş Kalemi</th>
                  <th className="border border-slate-300 px-3 py-2">Açıklama</th>
                  {contractors.map((c) => (
                    <th key={c} className="border border-slate-300 px-3 py-2 text-center">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workItems.map((wi, idx) => {
                  // Farklı bir iş kalemine geçildiğinde belirgin bir ayırıcı çizgi olsun diye
                  // (her satır zaten ayrı bir kalem) ilk satır hariç kalın üst kenarlık.
                  const dividerClass = idx > 0 ? "border-t-4 border-t-slate-500" : "";
                  return (
                    <tr key={wi} className="bg-[#E2EFDA] align-top">
                      <td
                        className={`border border-slate-300 px-3 py-3 font-bold text-slate-900 ${dividerClass}`}
                      >
                        {wi}
                      </td>
                      <td className={`border border-slate-300 px-3 py-3 text-slate-700 ${dividerClass}`}>
                        {notes.get(wi) ?? "-"}
                      </td>
                      {contractors.map((c) => {
                        const q = cells.get(`${wi}|${c}`);
                        return (
                          <td
                            key={c}
                            className={`border border-slate-300 px-3 py-3 text-center ${dividerClass}`}
                          >
                            {q ? (
                              <div className="space-y-1">
                                <div
                                  className={`text-base font-semibold tabular-nums ${q.selected ? "text-green-800" : "text-slate-900"}`}
                                >
                                  {formatCostAmount(q.amount, q.currency)}
                                </div>
                                {q.selected && (
                                  <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                    Seçildi
                                  </span>
                                )}
                                {!readOnly && !q.selected && (
                                  <form action={selectQuote.bind(null, recordId, q.id)}>
                                    <button
                                      type="submit"
                                      className="text-xs font-medium text-slate-600 hover:text-slate-900"
                                    >
                                      Seç
                                    </button>
                                  </form>
                                )}
                                {!readOnly && (
                                  <form action={deleteQuote.bind(null, recordId, q.id)}>
                                    <button
                                      type="submit"
                                      className="block text-xs font-medium text-red-600 hover:text-red-800"
                                    >
                                      Sil
                                    </button>
                                  </form>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Henüz teklif eklenmedi.</p>
        )}

        {!readOnly &&
          (addingOpen ? (
            <form
              action={addQuote.bind(null, recordId)}
              className="grid grid-cols-1 gap-4 rounded-md border border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-600">Firma Adı</span>
                <input name="contractorName" required className="input py-2.5 text-base" />
              </label>
              <WorkItemSelect key={quotes.length} knownWorkItems={workItems} issueTypes={issueTypes} />
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-600">Tutar</span>
                <div className="flex gap-2">
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    required
                    className="input min-w-0 flex-1 py-2.5 text-base"
                  />
                  <select name="currency" defaultValue="TRY" className="input w-24 py-2.5 text-base">
                    <option value="TRY">TL</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </label>
              <label className="block sm:col-span-2 lg:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-600">Açıklama</span>
                <input
                  name="note"
                  placeholder="Bu iş kalemi için (ilk teklifte girilir)"
                  className="input py-2.5 text-base"
                />
              </label>
              <div className="flex items-end gap-3">
                <SmallSubmit>Ekle</SmallSubmit>
                <button
                  type="button"
                  onClick={() => setAddingOpen(false)}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  Vazgeç
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAddingOpen(true)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              + İş Kalemi / Teklif Ekle
            </button>
          ))}
      </div>
    </details>
  );
}

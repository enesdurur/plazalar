"use client";

import { useState } from "react";
import { formatCostAmount } from "@/components/spare-part-cost-tile";

const OTHER_VALUE = "__other__";
const NO_WORK_ITEM = "İş Kalemi Belirtilmedi";

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

// Gönderilen örnek Excel'deki gibi (Maslak Square Plaza Baza Katı Duvar Örülmesi işi): satırlar
// iş kalemi (sabit), sütunlar teklif veren firmalar (kaç firma varsa o kadar sütun). Aynı
// kalem+firma için tek teklif olur — pivotByWorkItem bu ızgarayı satırlardan üretir.
function pivotByWorkItem(rows: DraftQuote[]) {
  const workItems: string[] = [];
  const contractors: string[] = [];
  const cells = new Map<string, DraftQuote>();
  const notes = new Map<string, string>();
  for (const r of rows) {
    const wi = r.workItem || NO_WORK_ITEM;
    if (!workItems.includes(wi)) workItems.push(wi);
    if (!contractors.includes(r.contractorName)) contractors.push(r.contractorName);
    cells.set(`${wi}|${r.contractorName}`, r);
    if (!notes.has(wi) && r.note) notes.set(wi, r.note);
  }
  return { workItems, contractors, cells, notes };
}

function AddQuoteForm({
  knownWorkItems,
  issueTypes,
  onAdd,
  onCancel,
}: {
  knownWorkItems: string[];
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

  // Bu kayıtta zaten kullanılan iş kalemleri + organizasyon kategorileri birleştirilip
  // tekrar seçilebiliyor — aynı kaleme yeni firma eklerken yazım farkıyla yeni bir satır
  // açılmasın diye.
  const options = Array.from(new Set([...knownWorkItems, ...issueTypes.map((t) => t.name)]));

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
    <div className="grid grid-cols-1 gap-4 rounded-md border border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-600">Firma Adı</span>
        <input
          value={contractorName}
          onChange={(e) => setContractorName(e.target.value)}
          className="input py-2.5 text-base"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-600">İş Kalemi</span>
        <select
          value={workItem}
          onChange={(e) => setWorkItem(e.target.value)}
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
            value={workItemOther}
            onChange={(e) => setWorkItemOther(e.target.value)}
            placeholder="İş kalemi adı"
            className="input mt-1 py-2.5 text-base"
          />
        )}
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-600">Tutar</span>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input min-w-0 flex-1 py-2.5 text-base"
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="input w-24 py-2.5 text-base"
          >
            <option value="TRY">TL</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </label>
      <label className="block sm:col-span-2 lg:col-span-2">
        <span className="mb-1 block text-sm font-medium text-slate-600">Açıklama</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Bu iş kalemi için (ilk teklifte girilir)"
          className="input py-2.5 text-base"
        />
      </label>
      <div className="flex items-end gap-3">
        <button
          type="button"
          onClick={submit}
          className="whitespace-nowrap rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Ekle
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}

export function QuoteDraftField({ issueTypes }: { issueTypes: { id: string; name: string }[] }) {
  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState("");
  const [rows, setRows] = useState<DraftQuote[]>([]);
  const [addingOpen, setAddingOpen] = useState(true);

  function addRow(row: Omit<DraftQuote, "key">) {
    setRows((prev) => [...prev, { ...row, key: nextKey() }]);
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  const { workItems, contractors, cells, notes } = pivotByWorkItem(rows);
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
          <input
            name="workTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Örn. Maslak Square Plaza Baza Katı Duvar Örülmesi ve Koridor Oluşturulması İşi"
            className="w-full rounded-md border-2 border-[#2F5597] px-3 py-2 text-center text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400"
          />

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
                                  <div className="text-base font-semibold tabular-nums text-slate-900">
                                    {formatCostAmount(q.amount, q.currency)}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeRow(q.key)}
                                    className="text-xs font-medium text-red-600 hover:text-red-800"
                                  >
                                    Sil
                                  </button>
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

          {addingOpen ? (
            <AddQuoteForm
              knownWorkItems={workItems}
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

          <p className="text-xs text-slate-500">
            Kayıt kaydedildikten sonra Kayıt Düzenle sayfasından daha fazla teklif ekleyebilir,
            birini seçebilirsiniz.
          </p>
        </div>
      )}

      <input type="hidden" name="quotesJson" value={JSON.stringify(payload)} />
    </div>
  );
}

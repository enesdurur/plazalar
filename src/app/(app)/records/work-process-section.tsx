"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { formatCostAmount } from "@/components/spare-part-cost-tile";
import {
  addQuote,
  deleteQuote,
  selectQuote,
  updateAwardInfo,
  updateInvoiceInfo,
  addPayment,
  deletePayment,
} from "./actions";

type Currency = "TRY" | "USD" | "EUR";

export interface QuoteInfo {
  id: string;
  contractorName: string;
  amount: number;
  currency: Currency;
  note: string | null;
  selected: boolean;
}

export interface PaymentInfo {
  id: string;
  amount: number;
  currency: Currency;
  paidAt: string;
  note: string | null;
}

export interface WorkProcessRecord {
  awardedContractor: string | null;
  awardedAmount: number | null;
  awardedCurrency: Currency | null;
  invoiceNo: string | null;
  invoiceAmount: number | null;
  invoiceCurrency: Currency | null;
  invoiceExchangeRate: number | null;
  invoicedAt: string | null;
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

function toDateInputValue(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function sumByCurrency<T extends { amount: number; currency: Currency }>(items: T[]) {
  const totals: Record<Currency, number> = { TRY: 0, USD: 0, EUR: 0 };
  for (const item of items) totals[item.currency] += item.amount;
  return totals;
}

export function WorkProcessSection({
  recordId,
  record,
  quotes,
  payments,
}: {
  recordId: string;
  record: WorkProcessRecord;
  quotes: QuoteInfo[];
  payments: PaymentInfo[];
}) {
  const paymentTotals = sumByCurrency(payments);
  const awarded = record.awardedAmount != null && record.awardedCurrency ? record.awardedCurrency : null;
  const remaining =
    awarded && record.awardedAmount != null
      ? record.awardedAmount - (paymentTotals[awarded] ?? 0)
      : null;

  return (
    <details className="mt-6 rounded-lg border border-slate-200 bg-white">
      <summary className="cursor-pointer select-none px-5 py-3 text-sm font-semibold text-slate-900">
        İş Süreci — Teklif / İş Verme / Fatura / Ödeme
      </summary>

      <div className="space-y-6 border-t border-slate-200 px-5 py-5">
        {/* Teklifler */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Teklifler</h3>
          {quotes.length > 0 ? (
            <div className="mt-2 overflow-hidden rounded-md border border-slate-200">
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
                  {quotes.map((q) => (
                    <tr key={q.id} className={q.selected ? "bg-green-50" : undefined}>
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
            <p className="mt-2 text-sm text-slate-500">Henüz teklif eklenmedi.</p>
          )}

          <form
            action={addQuote.bind(null, recordId)}
            className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            <Field label="Firma Adı">
              <input name="contractorName" required className="input" />
            </Field>
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

        {/* İşi Alan Firma */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900">İşi Alan Firma</h3>
          <p className="mt-1 text-xs text-slate-500">
            Yukarıdaki teklif listesinden birini &ldquo;Seç&rdquo;ince otomatik dolar;
            gerekirse elle de değiştirebilirsiniz.
          </p>
          <form
            action={updateAwardInfo.bind(null, recordId)}
            className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            <Field label="Firma Adı">
              <input
                name="awardedContractor"
                defaultValue={record.awardedContractor ?? ""}
                className="input"
              />
            </Field>
            <Field label="Anlaşılan Tutar">
              <div className="flex gap-1">
                <input
                  name="awardedAmount"
                  type="number"
                  step="0.01"
                  defaultValue={record.awardedAmount ?? ""}
                  className="input"
                />
                <select
                  name="awardedCurrency"
                  defaultValue={record.awardedCurrency ?? "TRY"}
                  className="input w-20"
                >
                  <option value="TRY">TL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </Field>
            <div className="flex items-end sm:col-span-2">
              <SmallSubmit>Kaydet</SmallSubmit>
            </div>
          </form>
        </div>

        {/* Fatura */}
        <InvoiceForm recordId={recordId} record={record} />

        {/* Ödemeler */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Ödemeler</h3>
          {payments.length > 0 ? (
            <div className="mt-2 overflow-hidden rounded-md border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Tarih</th>
                    <th className="px-3 py-2">Tutar</th>
                    <th className="px-3 py-2">Not</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2 text-slate-700">
                        {new Date(p.paidAt).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-slate-700">
                        {formatCostAmount(p.amount, p.currency)}
                      </td>
                      <td className="px-3 py-2 text-slate-500">{p.note ?? "-"}</td>
                      <td className="px-3 py-2 text-right">
                        <form action={deletePayment.bind(null, recordId, p.id)}>
                          <button
                            type="submit"
                            className="text-xs font-medium text-red-600 hover:text-red-800"
                          >
                            Sil
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Henüz ödeme eklenmedi.</p>
          )}

          <form
            action={addPayment.bind(null, recordId)}
            className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
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
            <Field label="Tarih">
              <input name="paidAt" type="date" required className="input" />
            </Field>
            <Field label="Not">
              <input name="note" placeholder="ör. Ön ödeme" className="input" />
            </Field>
            <div className="flex items-end">
              <SmallSubmit>Ödeme Ekle</SmallSubmit>
            </div>
          </form>

          {(paymentTotals.TRY > 0 || paymentTotals.USD > 0 || paymentTotals.EUR > 0) && (
            <p className="mt-3 text-xs text-slate-500">
              Toplam ödenen:{" "}
              {(["TRY", "USD", "EUR"] as Currency[])
                .filter((c) => paymentTotals[c] > 0)
                .map((c) => formatCostAmount(paymentTotals[c], c))
                .join(" · ")}
              {remaining !== null && awarded && (
                <> — Kalan: {formatCostAmount(remaining, awarded)}</>
              )}
            </p>
          )}
        </div>
      </div>
    </details>
  );
}

function InvoiceForm({ recordId, record }: { recordId: string; record: WorkProcessRecord }) {
  const [currency, setCurrency] = useState<Currency>(record.invoiceCurrency ?? "TRY");

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900">Fatura</h3>
      <form
        action={updateInvoiceInfo.bind(null, recordId)}
        className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <Field label="Fatura No">
          <input name="invoiceNo" defaultValue={record.invoiceNo ?? ""} className="input" />
        </Field>
        <Field label="Fatura Tutarı">
          <div className="flex gap-1">
            <input
              name="invoiceAmount"
              type="number"
              step="0.01"
              defaultValue={record.invoiceAmount ?? ""}
              className="input"
            />
            <select
              name="invoiceCurrency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="input w-20"
            >
              <option value="TRY">TL</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </Field>
        <Field label="Fatura Tarihi">
          <input
            name="invoicedAt"
            type="date"
            defaultValue={toDateInputValue(record.invoicedAt)}
            className="input"
          />
        </Field>
        <div className="flex items-end">
          <SmallSubmit>Kaydet</SmallSubmit>
        </div>
        {currency !== "TRY" && (
          <Field label={`Kur (1 ${currency} = ? TL)`}>
            <input
              name="invoiceExchangeRate"
              type="number"
              step="0.0001"
              min="0"
              defaultValue={record.invoiceExchangeRate ?? ""}
              placeholder="örn. 34.50"
              className="input"
            />
          </Field>
        )}
      </form>
    </div>
  );
}

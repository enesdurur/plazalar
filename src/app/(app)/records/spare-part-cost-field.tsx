"use client";

import { useState } from "react";

export function SparePartCostField({
  defaultCost,
  defaultCurrency,
  defaultExchangeRate,
}: {
  defaultCost?: string | null;
  defaultCurrency: string;
  defaultExchangeRate?: string | null;
}) {
  const [currency, setCurrency] = useState(defaultCurrency);

  return (
    <Field label="Yedek Parça Maliyeti">
      <div className="flex gap-2">
        <input
          name="sparePartCost"
          type="number"
          step="0.01"
          defaultValue={defaultCost ?? ""}
          className="input"
        />
        <select
          name="sparePartCostCurrency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="input w-24"
        >
          <option value="TRY">TL</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </div>
      {currency !== "TRY" && (
        <div className="mt-2">
          <span className="mb-1 block text-xs text-slate-500">
            Kur (1 {currency} = ? TL) — gerçekleşen bütçeye yansıması için gerekli
          </span>
          <input
            name="sparePartExchangeRate"
            type="number"
            step="0.0001"
            min="0"
            defaultValue={defaultExchangeRate ?? ""}
            className="input"
            placeholder="örn. 34.50"
          />
        </div>
      )}
    </Field>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

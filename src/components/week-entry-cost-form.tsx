"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/submit-button";

export function WeekEntryCostForm({
  action,
  defaults,
}: {
  action: (formData: FormData) => Promise<void>;
  defaults: {
    cost?: string | null;
    costCurrency: string;
    costExchangeRate?: string | null;
    note?: string | null;
    sparePartCost?: string | null;
    sparePartCostCurrency: string;
    sparePartExchangeRate?: string | null;
    sparePartNote?: string | null;
  };
}) {
  const [hasSparePart, setHasSparePart] = useState(defaults.sparePartCost != null);
  const [costCurrency, setCostCurrency] = useState(defaults.costCurrency);
  const [sparePartCostCurrency, setSparePartCostCurrency] = useState(defaults.sparePartCostCurrency);

  return (
    <form action={action} className="mt-6 max-w-md space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Bakım Maliyeti</span>
        <div className="flex gap-2">
          <input
            name="cost"
            type="number"
            step="0.01"
            defaultValue={defaults.cost ?? ""}
            className="input"
          />
          <select
            name="costCurrency"
            value={costCurrency}
            onChange={(e) => setCostCurrency(e.target.value)}
            className="input w-24"
          >
            <option value="TRY">TL</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        {costCurrency !== "TRY" && (
          <div className="mt-2">
            <span className="mb-1 block text-xs text-slate-500">
              Kur (1 {costCurrency} = ? TL) — gerçekleşen bütçeye yansıması için gerekli
            </span>
            <input
              name="costExchangeRate"
              type="number"
              step="0.0001"
              min="0"
              defaultValue={defaults.costExchangeRate ?? ""}
              className="input"
              placeholder="örn. 34.50"
            />
          </div>
        )}
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Not</span>
        <textarea name="note" rows={3} defaultValue={defaults.note ?? ""} className="input" />
      </label>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="hasSparePart"
          checked={hasSparePart}
          onChange={(e) => setHasSparePart(e.target.checked)}
        />
        Yedek parça kullanıldı
      </label>

      {hasSparePart && (
        <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Yedek Parça Maliyeti
            </span>
            <div className="flex gap-2">
              <input
                name="sparePartCost"
                type="number"
                step="0.01"
                defaultValue={defaults.sparePartCost ?? ""}
                className="input"
              />
              <select
                name="sparePartCostCurrency"
                value={sparePartCostCurrency}
                onChange={(e) => setSparePartCostCurrency(e.target.value)}
                className="input w-24"
              >
                <option value="TRY">TL</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            {sparePartCostCurrency !== "TRY" && (
              <div className="mt-2">
                <span className="mb-1 block text-xs text-slate-500">
                  Kur (1 {sparePartCostCurrency} = ? TL) — gerçekleşen bütçeye yansıması için gerekli
                </span>
                <input
                  name="sparePartExchangeRate"
                  type="number"
                  step="0.0001"
                  min="0"
                  defaultValue={defaults.sparePartExchangeRate ?? ""}
                  className="input"
                  placeholder="örn. 34.50"
                />
              </div>
            )}
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Yedek Parça (ne kullanıldı)
            </span>
            <input
              name="sparePartNote"
              defaultValue={defaults.sparePartNote ?? ""}
              className="input"
              placeholder="örn. Rezistans, yağ borusu..."
            />
          </label>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}

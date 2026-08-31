"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/submit-button";

const AUTO_SOURCE_OPTIONS = [
  { value: "", label: "Yok — tutarı elle giriyorum" },
  { value: "MAINTENANCE_PLAN", label: "3. Firma Bakım Planı" },
  { value: "INSPECTION", label: "Periyodik (Fenni) Muayene" },
  { value: "FAULT_RECORDS", label: "Arıza Kayıtları (yedek parça)" },
];

export function LineItemForm({
  action,
  defaults,
}: {
  action: (formData: FormData) => Promise<void>;
  defaults?: {
    category?: string | null;
    label: string;
    monthlyBudget: number;
    isFixedContract: boolean;
    fixedAmount?: number | null;
    autoSource?: string | null;
  };
}) {
  const [isFixed, setIsFixed] = useState(defaults?.isFixedContract ?? false);

  return (
    <form action={action} className="max-w-lg space-y-4">
      <Field label="Kategori (opsiyonel, örn. TEKNİK / GÜVENLİK)">
        <input name="category" defaultValue={defaults?.category ?? ""} className="input" />
      </Field>
      <Field label="Kalem Adı *">
        <input name="label" required defaultValue={defaults?.label} className="input" />
      </Field>
      <Field label="Aylık Taslak Bütçe (TL) *">
        <input
          name="monthlyBudget"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={defaults?.monthlyBudget}
          className="input"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="isFixedContract"
          checked={isFixed}
          onChange={(e) => setIsFixed(e.target.checked)}
        />
        Sözleşme bedeli sabit — her ay elle tutar girmek yerine onay kutusuyla işaretlensin
      </label>

      {isFixed && (
        <Field label="Sabit Aylık Tutar (TL) *">
          <input
            name="fixedAmount"
            type="number"
            step="0.01"
            min="0"
            required={isFixed}
            defaultValue={defaults?.fixedAmount ?? defaults?.monthlyBudget}
            className="input"
          />
        </Field>
      )}

      <Field label="Otomatik Kaynak">
        <select name="autoSource" defaultValue={defaults?.autoSource ?? ""} className="input">
          {AUTO_SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-slate-500">
          Seçilirse bu kalemin aylık tutarı elle girilmez, ilgili modüldeki maliyet
          kayıtlarından otomatik hesaplanır. Plaza+yıl başına her kaynak için tek kalem
          aktif olabilir — başka bir kalemde seçiliyse oradan otomatik kaldırılır.
        </span>
      </Field>

      <div className="flex gap-3 pt-2">
        <SubmitButton />
      </div>
    </form>
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

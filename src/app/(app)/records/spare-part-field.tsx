"use client";

import { useState } from "react";
import type { SparePart } from "@prisma/client";

const OTHER_VALUE = "__other__";

export function SparePartField({
  spareParts,
  defaultSparePartId,
  defaultSparePartOther,
}: {
  spareParts: SparePart[];
  defaultSparePartId?: string | null;
  defaultSparePartOther?: string | null;
}) {
  const [value, setValue] = useState(
    defaultSparePartId ?? (defaultSparePartOther ? OTHER_VALUE : "")
  );

  return (
    <>
      <Field label="Kullanılan Yedek Parça">
        <select
          name="sparePartId"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input"
        >
          <option value="">Seçiniz</option>
          {spareParts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
          <option value={OTHER_VALUE}>Diğer (elle yazılacak)</option>
        </select>
      </Field>
      {value === OTHER_VALUE && (
        <Field label="Diğer Parça Adı">
          <input
            name="sparePartOtherName"
            defaultValue={defaultSparePartOther ?? ""}
            className="input"
          />
        </Field>
      )}
    </>
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

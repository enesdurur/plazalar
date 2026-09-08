"use client";

import { useState } from "react";

const OTHER_VALUE = "__other__";

export function IssueTypeField({
  issueTypes,
  defaultIssueTypeId,
  defaultIssueTypeOther,
}: {
  issueTypes: { id: string; name: string }[];
  defaultIssueTypeId?: string | null;
  defaultIssueTypeOther?: string | null;
}) {
  const [value, setValue] = useState(
    defaultIssueTypeId ?? (defaultIssueTypeOther ? OTHER_VALUE : "")
  );

  return (
    <>
      <Field label="Kategori">
        <select
          name="issueTypeId"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input"
        >
          <option value="">Seçiniz</option>
          {issueTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
          <option value={OTHER_VALUE}>Diğer (elle yazılacak)</option>
        </select>
      </Field>
      {value === OTHER_VALUE && (
        <Field label="Diğer Kategori">
          <input
            name="issueTypeOtherName"
            defaultValue={defaultIssueTypeOther ?? ""}
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

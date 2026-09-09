"use client";

import { useState } from "react";

const OTHER_VALUE = "__other__";

export function IssueTypeField({
  issueTypes,
  defaultIssueTypeIds,
  defaultIssueTypeOther,
}: {
  issueTypes: { id: string; name: string }[];
  defaultIssueTypeIds?: string[];
  defaultIssueTypeOther?: string | null;
}) {
  const [isOther, setIsOther] = useState(!!defaultIssueTypeOther);

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-slate-700">Kategori</span>
      <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-slate-300 p-2">
        {issueTypes.map((t) => (
          <label key={t.id} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="issueTypeIds"
              value={t.id}
              defaultChecked={defaultIssueTypeIds?.includes(t.id)}
            />
            {t.name}
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="issueTypeIds"
            value={OTHER_VALUE}
            checked={isOther}
            onChange={(e) => setIsOther(e.target.checked)}
          />
          Diğer (elle yazılacak)
        </label>
      </div>
      {isOther && (
        <input
          name="issueTypeOtherName"
          defaultValue={defaultIssueTypeOther ?? ""}
          placeholder="Diğer kategori adı"
          className="input mt-1"
        />
      )}
    </div>
  );
}

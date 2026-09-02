"use client";

import { useState } from "react";
import Link from "next/link";

export function CompanySelector() {
  const [showKapitalNotice, setShowKapitalNotice] = useState(false);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setShowKapitalNotice((v) => !v)}
        className="w-full rounded-md border border-slate-200 px-4 py-3 text-left text-sm font-bold uppercase text-slate-900 hover:border-slate-400 hover:bg-slate-50"
      >
        Kapital Gayrimenkul
      </button>
      {showKapitalNotice && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          Bu bölüm yapım aşamasındadır.
        </p>
      )}

      <Link
        href="/select-plaza"
        className="block w-full rounded-md border border-slate-200 px-4 py-3 text-left text-sm font-bold uppercase text-slate-900 hover:border-slate-400 hover:bg-slate-50"
      >
        Burgaz Yönetim
      </Link>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

export function CompanySelector() {
  const [showKapitalNotice, setShowKapitalNotice] = useState(false);

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setShowKapitalNotice((v) => !v)}
          className="flex h-48 items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-4 text-center text-xl font-bold uppercase text-slate-900 shadow-sm transition hover:border-slate-400 hover:shadow-md sm:h-56"
        >
          Kapital Gayrimenkul
        </button>

        <Link
          href="/select-plaza"
          className="flex h-48 items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-4 text-center text-xl font-bold uppercase text-slate-900 shadow-sm transition hover:border-slate-400 hover:shadow-md sm:h-56"
        >
          Burgaz Yönetim
        </Link>
      </div>

      {showKapitalNotice && (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-center text-sm font-medium text-amber-700">
          Bu bölüm yapım aşamasındadır.
        </p>
      )}
    </div>
  );
}

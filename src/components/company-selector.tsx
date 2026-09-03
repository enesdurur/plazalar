"use client";

import { useState } from "react";
import Link from "next/link";

export function CompanySelector() {
  const [showKapitalNotice, setShowKapitalNotice] = useState(false);

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <button
        type="button"
        onClick={() => setShowKapitalNotice((v) => !v)}
        className="relative flex flex-1 items-center justify-center bg-white px-4 text-center transition hover:bg-slate-50"
      >
        <span className="text-2xl font-bold uppercase tracking-wide text-slate-900 sm:text-4xl">
          Kapital Gayrimenkul
        </span>
        {showKapitalNotice && (
          <p className="absolute bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
            Bu bölüm yapım aşamasındadır.
          </p>
        )}
      </button>

      <div className="h-px bg-slate-200 sm:h-auto sm:w-px" />

      <Link
        href="/select-plaza"
        className="flex flex-1 items-center justify-center bg-slate-50 px-4 text-center transition hover:bg-slate-100"
      >
        <span className="text-2xl font-bold uppercase tracking-wide text-slate-900 sm:text-4xl">
          Burgaz Yönetim
        </span>
      </Link>
    </div>
  );
}

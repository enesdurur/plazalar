"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="tr">
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <p className="text-lg font-semibold text-slate-900">Bir şeyler ters gitti</p>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          {error.message || "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin."}
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Tekrar Dene
        </button>
      </body>
    </html>
  );
}

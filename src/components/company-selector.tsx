import Link from "next/link";

export function CompanySelector() {
  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <Link
        href="/kapital"
        className="flex flex-1 items-center justify-center bg-white px-4 text-center transition hover:bg-slate-50"
      >
        <span className="text-2xl font-bold uppercase tracking-wide text-slate-900 sm:text-4xl">
          Kapital Gayrimenkul
        </span>
      </Link>

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

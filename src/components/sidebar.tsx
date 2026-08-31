"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

export function Sidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  return (
    <>
      <div className="flex items-center justify-between bg-slate-900 px-4 py-3 md:hidden print:hidden">
        <div>
          <p className="text-sm font-semibold text-white">Plazalar Teknik Hizmetler</p>
          <p className="text-xs text-slate-400">Bakım &amp; Arıza Yönetimi</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menüyü aç/kapat"
          aria-expanded={open}
          className="rounded-md p-2 text-white hover:bg-slate-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-6 w-6"
          >
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      <aside
        className={`${
          open ? "flex" : "hidden"
        } w-full shrink-0 flex-col bg-slate-900 p-4 print:hidden md:flex md:w-64`}
      >
        <div className="mb-6 hidden px-2 md:block">
          <p className="text-sm font-semibold text-white">Plazalar Teknik Hizmetler</p>
          <p className="text-xs text-slate-400">Bakım &amp; Arıza Yönetimi</p>
        </div>
        {children}
      </aside>
    </>
  );
}

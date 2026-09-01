"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Panel" },
  { href: "/budget", label: "Gerçekleşen Bütçe" },
  { href: "/annual-plan", label: "3. Firma Bakım Planı" },
  { href: "/inspections", label: "Periyodik (Fenni) Muayene" },
  { href: "/records", label: "Arıza Kayıtları" },
  { href: "/machines", label: "Makine / Teçhizat" },
  { href: "/tenants", label: "Kiracılar" },
  { href: "/tenant-maintenance", label: "Kiracı Bakımları" },
  // Kalibrasyon Planı ve Doğrulama Planı şu anlık menüden gizlendi
  // (sayfalar hâlâ mevcut: /calibrations, /verifications)
];

const ADMIN_LINKS = [{ href: "/users", label: "Kullanıcılar" }];

export function NavLinks({ showUsers = false }: { showUsers?: boolean }) {
  const pathname = usePathname();
  const links = showUsers ? [...LINKS, ...ADMIN_LINKS] : LINKS;

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              active
                ? "bg-slate-800 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

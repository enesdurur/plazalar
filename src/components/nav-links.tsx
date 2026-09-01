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

export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-2 text-sm font-medium ${
        active
          ? "bg-slate-800 text-white"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

export function NavLinks() {
  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((link) => (
        <NavLink key={link.href} href={link.href} label={link.label} />
      ))}
    </nav>
  );
}

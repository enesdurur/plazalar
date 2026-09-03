"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Panel" },
  { href: "/budget", label: "Gerçekleşen Bütçe" },
  { href: "/other-expenses", label: "Diğer Giderler" },
  { href: "/annual-plan", label: "3. Firma Bakım Planı", indent: true },
  { href: "/inspections", label: "Periyodik (Fenni) Muayene", indent: true },
  { href: "/records", label: "Arıza Kayıtları", indent: true },
  { href: "/machines", label: "Makine / Teçhizat" },
  { href: "/tenants", label: "Kiracılar" },
  { href: "/tenant-maintenance", label: "Kiracı Bakımları" },
];

export function NavLink({
  href,
  label,
  indent,
}: {
  href: string;
  label: string;
  indent?: boolean;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-2 text-sm font-medium ${indent ? "ml-4" : ""} ${
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
        <NavLink key={link.href} href={link.href} label={link.label} indent={link.indent} />
      ))}
    </nav>
  );
}

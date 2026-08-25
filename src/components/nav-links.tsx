"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Panel" },
  { href: "/machines", label: "Makine / Teçhizat" },
  { href: "/records", label: "Arıza / Bakım Kayıtları" },
  { href: "/annual-plan", label: "Yıllık Bakım Planı" },
  { href: "/inspections", label: "Periyodik Muayene" },
  { href: "/calibrations", label: "Kalibrasyon Planı" },
  { href: "/verifications", label: "Doğrulama Planı" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((link) => {
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

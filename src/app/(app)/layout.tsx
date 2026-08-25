import Link from "next/link";
import { auth } from "@/auth";
import { getSelectedPlaza } from "@/lib/plaza";
import { NavLinks } from "@/components/nav-links";
import { LogoutButton } from "@/components/logout-button";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Yönetici",
  TECHNICIAN: "Teknisyen",
  VIEWER: "İzleyici",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;
  const plaza = await getSelectedPlaza();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col bg-slate-900 p-4">
        <div className="mb-6 px-2">
          <p className="text-sm font-semibold text-white">Plazalar Teknik Hizmetler</p>
          <p className="text-xs text-slate-400">Bakım &amp; Arıza Yönetimi</p>
        </div>
        <div className="mb-4 rounded-md bg-slate-800 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Plaza</p>
          <p className="truncate text-sm font-medium text-white">{plaza.name}</p>
          <Link
            href="/select-plaza"
            className="text-xs text-slate-400 underline hover:text-slate-200"
          >
            Değiştir
          </Link>
        </div>
        <NavLinks />
        <div className="mt-auto border-t border-slate-800 pt-4">
          {user && (
            <div className="px-2 pb-2">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-slate-400">
                {ROLE_LABELS[user.role] ?? user.role}
              </p>
            </div>
          )}
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 bg-slate-50 p-8">{children}</main>
    </div>
  );
}

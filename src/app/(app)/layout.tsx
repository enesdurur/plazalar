import Link from "next/link";
import { auth } from "@/auth";
import { getSelectedPlaza } from "@/lib/plaza";
import { ROLE_LABELS, canManageUsers } from "@/lib/permissions";
import { NavLinks } from "@/components/nav-links";
import { LogoutButton } from "@/components/logout-button";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;
  const plaza = await getSelectedPlaza();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar>
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
        <NavLinks showUsers={canManageUsers(user?.role)} />
        <div className="mt-4 border-t border-slate-800 pt-4">
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
      </Sidebar>
      <main className="flex-1 overflow-x-hidden bg-slate-50 p-4 md:p-8 print:bg-white print:p-0">
        {children}
      </main>
    </div>
  );
}

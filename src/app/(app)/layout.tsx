import { auth } from "@/auth";
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

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col bg-slate-900 p-4">
        <div className="mb-6 px-2">
          <p className="text-sm font-semibold text-white">Plazalar Teknik Hizmetler</p>
          <p className="text-xs text-slate-400">Bakım &amp; Arıza Yönetimi</p>
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

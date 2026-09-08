import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessKapitalDashboard } from "@/lib/permissions";
import { sortByPlazaOrder } from "@/lib/plaza-order";
import { StatTile } from "@/components/stat-tile";
import { LogoutButton } from "@/components/logout-button";
import { selectPlaza } from "@/app/select-plaza/actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kapital Gayrimenkul",
};

export const dynamic = "force-dynamic";

export default async function KapitalDashboardPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  if (!canAccessKapitalDashboard(session.user.role)) redirect("/select-plaza");

  const organizationId = session.user.organizationId;

  const [plazasRaw, records] = await Promise.all([
    prisma.plaza.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
    prisma.maintenanceRecord.findMany({
      where: { plaza: { organizationId } },
      select: { plazaId: true, finishedAt: true },
    }),
  ]);
  const plazas = sortByPlazaOrder(plazasRaw);

  const completedCount = records.filter((r) => r.finishedAt).length;
  const ongoingCount = records.length - completedCount;

  const byPlaza = plazas.map((plaza) => {
    const plazaRecords = records.filter((r) => r.plazaId === plaza.id);
    return {
      plaza,
      count: plazaRecords.length,
      ongoing: plazaRecords.filter((r) => !r.finishedAt).length,
      completed: plazaRecords.filter((r) => r.finishedAt).length,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between bg-slate-900 px-4 py-3 md:px-8">
        <div>
          <p className="text-sm font-semibold text-white">Kapital Gayrimenkul</p>
          <p className="text-xs text-slate-400">Tüm plazaların birleşik görünümü</p>
        </div>
        <nav className="flex items-center gap-1">
          <Link
            href="/kapital"
            className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white"
          >
            Panel
          </Link>
          <Link
            href="/kapital/records"
            className="rounded-md px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Kayıtlar
          </Link>
          <Link
            href="/select-company"
            className="rounded-md px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Şirket Değiştir
          </Link>
          <LogoutButton />
        </nav>
      </header>

      <main className="p-4 md:p-8">
        <h1 className="text-xl font-semibold text-slate-900">Kapital Panel</h1>
        <p className="mt-1 text-sm text-slate-500">
          {plazas.length} plaza · {records.length} toplam arıza/bakım kaydı.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Toplam Kayıt"
            value={String(records.length)}
            hint={`${completedCount} tamamlanan · ${ongoingCount} devam eden`}
          />
          <StatTile label="Devam Eden" value={String(ongoingCount)} />
          <StatTile label="Tamamlanan" value={String(completedCount)} />
          <StatTile label="Plaza Sayısı" value={String(plazas.length)} />
        </div>

        <h2 className="mt-8 text-sm font-semibold text-slate-900">Plazalar</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {byPlaza.map(({ plaza, count, ongoing, completed }) => (
            <div key={plaza.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-900">{plaza.name}</p>
              <div className="mt-2 flex gap-3 text-xs text-slate-500">
                <span>
                  <span className="font-medium text-slate-700">{count}</span> kayıt
                </span>
                <span>
                  <span className="font-medium text-amber-600">{ongoing}</span> devam eden
                </span>
                <span>
                  <span className="font-medium text-green-600">{completed}</span> tamamlanan
                </span>
              </div>
              <form action={selectPlaza.bind(null, plaza.id)} className="mt-4">
                <button
                  type="submit"
                  className="w-full rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Bu plazaya git →
                </button>
              </form>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

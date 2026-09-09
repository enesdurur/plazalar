import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessKapitalDashboard } from "@/lib/permissions";
import { LogoutButton } from "@/components/logout-button";
import { RecordsTable } from "@/app/(app)/records/records-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kapital — Kayıtlar",
};

export const dynamic = "force-dynamic";

export default async function KapitalRecordsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  if (!canAccessKapitalDashboard(session.user.role)) redirect("/select-plaza");

  const organizationId = session.user.organizationId;

  const records = await prisma.maintenanceRecord.findMany({
    where: { plaza: { organizationId } },
    include: {
      plaza: true,
      machine: true,
      issueTypes: true,
      technician: true,
      quotes: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { reportedAt: "desc" },
    take: 500,
  });

  // Prisma Decimal alanları Client Component'lere doğrudan aktarılamaz — düz sayıya çeviriyoruz.
  const serialized = records.map((r) => ({
    ...r,
    sparePartCost: r.sparePartCost != null ? Number(r.sparePartCost) : null,
    sparePartExchangeRate: r.sparePartExchangeRate != null ? Number(r.sparePartExchangeRate) : null,
    quotes: r.quotes.map((q) => ({ ...q, amount: Number(q.amount) })),
  }));

  const ongoing = serialized.filter((r) => !r.finishedAt);
  const completed = serialized.filter((r) => r.finishedAt);

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
            className="rounded-md px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Panel
          </Link>
          <Link
            href="/kapital/records"
            className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white"
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
        <h1 className="text-xl font-semibold text-slate-900">Tüm Plazaların Kayıtları</h1>
        <p className="mt-1 text-sm text-slate-500">Son {records.length} kayıt gösteriliyor.</p>

        <h2 className="mt-6 text-sm font-semibold text-slate-900">
          Devam Eden Kayıtlar ({ongoing.length})
        </h2>
        <div className="mt-3">
          <RecordsTable
            records={ongoing}
            writable={false}
            deletable={false}
            showPlaza
            emptyMessage="Devam eden kayıt yok."
          />
        </div>

        <h2 className="mt-8 text-sm font-semibold text-slate-900">
          Tamamlanan Kayıtlar ({completed.length})
        </h2>
        <div className="mt-3">
          <RecordsTable
            records={completed}
            writable={false}
            deletable={false}
            showPlaza
            emptyMessage="Tamamlanan kayıt yok."
          />
        </div>
      </main>
    </div>
  );
}

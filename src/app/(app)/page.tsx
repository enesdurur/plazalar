import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { mtta, mttr, average, formatMinutes } from "@/lib/kpi";
import { StatTile } from "@/components/stat-tile";
import { BarBreakdown } from "@/components/bar-breakdown";
import { SparePartCostTile, MaintenanceCostTile } from "@/components/spare-part-cost-tile";
import { TcmbRatesCard } from "@/components/tcmb-rates-card";
import { getTcmbRates } from "@/lib/tcmb";
import { MONTH_WEEK_RANGES } from "@/lib/plan/weeks";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel",
};

export default async function DashboardPage() {
  const plaza = await getSelectedPlaza();

  const records = await prisma.maintenanceRecord.findMany({
    where: { machine: { plazaId: plaza.id } },
    include: { machine: true },
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthRange = MONTH_WEEK_RANGES[now.getMonth()];
  const currentMonthWeeks = Array.from(
    { length: currentMonthRange.endWeek - currentMonthRange.startWeek + 1 },
    (_, i) => currentMonthRange.startWeek + i
  );

  const [
    maintenancePlanItemTotal,
    inspectionPlanItemTotal,
    planWeekEntriesThisMonth,
    inspectionWeekEntriesThisMonth,
    tcmbRates,
    costedInspections,
    costedPlanEntries,
    costedPlanWeekEntries,
    costedInspectionWeekEntries,
    tenantMaintenanceTotal,
    tenantMaintenanceExpired,
  ] = await Promise.all([
    prisma.maintenancePlanItem.count({ where: { plazaId: plaza.id } }),
    prisma.inspectionPlanItem.count({ where: { plazaId: plaza.id } }),
    prisma.maintenancePlanWeekEntry.findMany({
      where: { year: currentYear, week: { in: currentMonthWeeks }, item: { plazaId: plaza.id } },
    }),
    prisma.inspectionPlanWeekEntry.findMany({
      where: { year: currentYear, week: { in: currentMonthWeeks }, item: { plazaId: plaza.id } },
    }),
    getTcmbRates(),
    prisma.periodicInspection.findMany({
      where: { plazaId: plaza.id, cost: { not: null } },
      select: { cost: true, costCurrency: true },
    }),
    prisma.maintenancePlanEntry.findMany({
      where: { cost: { not: null }, machine: { plazaId: plaza.id } },
      select: { cost: true, costCurrency: true },
    }),
    prisma.maintenancePlanWeekEntry.findMany({
      where: { cost: { not: null }, item: { plazaId: plaza.id } },
      select: { cost: true, costCurrency: true },
    }),
    prisma.inspectionPlanWeekEntry.findMany({
      where: { cost: { not: null }, item: { plazaId: plaza.id } },
      select: { cost: true, costCurrency: true },
    }),
    prisma.tenantMaintenance.count({ where: { tenant: { plazaId: plaza.id } } }),
    prisma.tenantMaintenance.count({
      where: { tenant: { plazaId: plaza.id }, nextMaintenanceDate: { lt: now } },
    }),
  ]);

  const planDoneThisMonth = planWeekEntriesThisMonth.filter((e) => e.completed === true).length;
  const planMissedThisMonth = planWeekEntriesThisMonth.filter((e) => e.completed === false).length;
  const inspectionDoneThisMonth = inspectionWeekEntriesThisMonth.filter(
    (e) => e.completed === true
  ).length;
  const inspectionMissedThisMonth = inspectionWeekEntriesThisMonth.filter(
    (e) => e.completed === false
  ).length;

  const arizaCount = records.filter((r) => r.operationType === "ARIZA").length;
  const bakimCount = records.filter((r) => r.operationType === "BAKIM").length;

  const completedRecordCount = records.filter((r) => r.finishedAt).length;
  const ongoingRecordCount = records.length - completedRecordCount;

  const mttaValues = records
    .map((r) => mtta(r.reportedAt, r.respondedAt))
    .filter((v): v is number => v !== null);
  const mttrValues = records
    .map((r) => mttr(r.respondedAt, r.finishedAt))
    .filter((v): v is number => v !== null);

  const sparePartCostByCurrency = { TRY: 0, USD: 0, EUR: 0 };
  for (const r of records) {
    if (r.sparePartCost) {
      sparePartCostByCurrency[r.sparePartCostCurrency] += Number(r.sparePartCost);
    }
  }

  const maintenanceCostByCurrency = { TRY: 0, USD: 0, EUR: 0 };
  for (const i of costedInspections) {
    if (i.cost) maintenanceCostByCurrency[i.costCurrency] += Number(i.cost);
  }
  for (const e of costedPlanEntries) {
    if (e.cost) maintenanceCostByCurrency[e.costCurrency] += Number(e.cost);
  }
  for (const e of costedPlanWeekEntries) {
    if (e.cost) maintenanceCostByCurrency[e.costCurrency] += Number(e.cost);
  }
  for (const e of costedInspectionWeekEntries) {
    if (e.cost) maintenanceCostByCurrency[e.costCurrency] += Number(e.cost);
  }

  const downtimeByMachine = new Map<string, number>();
  for (const r of records) {
    const downtime = mttr(r.respondedAt, r.finishedAt) ?? 0;
    downtimeByMachine.set(
      r.machine.name,
      (downtimeByMachine.get(r.machine.name) ?? 0) + downtime
    );
  }
  const topMachines = [...downtimeByMachine.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Panel</h1>
          <p className="mt-1 text-sm text-slate-500">
            Teknik hizmetler arıza ve bakım performans özeti.
          </p>
        </div>
        <TcmbRatesCard rates={tcmbRates} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/records"
          className="block rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-300"
        >
          <p className="text-sm font-medium text-slate-500">Toplam Kayıt</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
            {records.length}
          </p>
          <div className="mt-2 flex gap-3 text-xs text-slate-500">
            <span>
              <span className="font-medium text-green-600">{completedRecordCount}</span>{" "}
              tamamlanan
            </span>
            <span>
              <span className="font-medium text-amber-600">{ongoingRecordCount}</span> devam eden
            </span>
          </div>
        </Link>
        <MaintenanceCostTile totals={maintenanceCostByCurrency} />
        <SparePartCostTile totals={sparePartCostByCurrency} />
      </div>

      <h2 className="mt-8 text-sm font-semibold text-slate-900">Uygunluk Durumu</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PlanStatusTile
          href="/annual-plan"
          label="Yıllık Bakım Planı (Bu Ay)"
          done={planDoneThisMonth}
          missed={planMissedThisMonth}
          totalItems={maintenancePlanItemTotal}
        />
        <PlanStatusTile
          href="/inspections"
          label="Periyodik (Fenni) Muayene (Bu Ay)"
          done={inspectionDoneThisMonth}
          missed={inspectionMissedThisMonth}
          totalItems={inspectionPlanItemTotal}
        />
        <ComplianceTile
          href="/tenant-maintenance"
          label="Kiracı Bakımları"
          total={tenantMaintenanceTotal}
          expired={tenantMaintenanceExpired}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">İşlem Türü Dağılımı</h2>
          <div className="mt-4 space-y-3">
            <CategoricalBar
              label="Arıza"
              value={arizaCount}
              total={records.length}
              color="var(--viz-series-fault)"
            />
            <CategoricalBar
              label="Bakım"
              value={bakimCount}
              total={records.length}
              color="var(--viz-series-maint)"
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Toplam Arıza Süresine Göre En Çok Duran Makineler (MTTR)
          </h2>
          <BarBreakdown
            items={topMachines.map(([label, value]) => ({
              label,
              value,
              displayValue: formatMinutes(value),
            }))}
          />
          {topMachines.length === 0 && (
            <p className="mt-4 text-sm text-slate-500">Henüz veri yok.</p>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTile
          label="Ortalama MTTA"
          value={formatMinutes(average(mttaValues))}
          hint="Bildirim → Müdahale"
        />
        <StatTile
          label="Ortalama MTTR"
          value={formatMinutes(average(mttrValues))}
          hint="Müdahale → Bitiş"
        />
      </div>
    </div>
  );
}

function PlanStatusTile({
  href,
  label,
  done,
  missed,
  totalItems,
}: {
  href: string;
  label: string;
  done: number;
  missed: number;
  totalItems: number;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-300"
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        <span
          className="text-2xl font-semibold tabular-nums"
          style={{ color: "var(--viz-status-good)" }}
        >
          {done}
        </span>
        <span className="text-sm text-slate-400">yapıldı,</span>
        <span
          className="text-2xl font-semibold tabular-nums"
          style={{ color: "var(--viz-status-critical)" }}
        >
          {missed}
        </span>
        <span className="text-sm text-slate-400">yapılmadı / {totalItems} kalem</span>
      </div>
    </Link>
  );
}

function ComplianceTile({
  href,
  label,
  total,
  expired,
}: {
  href: string;
  label: string;
  total: number;
  expired: number;
}) {
  const ok = expired === 0;
  return (
    <Link
      href={href}
      className="block rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-300"
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span
          className="text-2xl font-semibold tabular-nums"
          style={{ color: ok ? "var(--viz-status-good)" : "var(--viz-status-critical)" }}
        >
          {expired}
        </span>
        <span className="text-sm text-slate-400">/ {total} süresi geçmiş</span>
      </div>
    </Link>
  );
}

function CategoricalBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium text-slate-700">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          {label}
        </span>
        <span className="text-slate-500">
          {value} ({pct}%)
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

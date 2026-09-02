import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { mtta, mttr, average, formatMinutes } from "@/lib/kpi";
import { StatTile } from "@/components/stat-tile";
import { BarBreakdown } from "@/components/bar-breakdown";
import { CostBreakdownTile, FaultCostTile } from "@/components/spare-part-cost-tile";
import { TcmbRatesCard } from "@/components/tcmb-rates-card";
import { getTcmbRates } from "@/lib/tcmb";
import { MONTH_NAMES } from "@/lib/plan/weeks";
import { computePlanYearStats, type PlanYearStats } from "@/lib/plan/stats";
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
  const currentMonthIdx = now.getMonth();

  const [
    maintenancePlanItems,
    inspectionPlanItems,
    planWeekEntriesThisYear,
    inspectionWeekEntriesThisYear,
    tcmbRates,
    costedInspections,
    costedPlanEntries,
    costedPlanWeekEntries,
    costedInspectionWeekEntries,
    tenantMaintenanceItems,
    tenantMaintenanceWeekEntriesThisYear,
  ] = await Promise.all([
    prisma.maintenancePlanItem.findMany({
      where: { plazaId: plaza.id },
      select: { id: true, label: true, scheduledWeeks: true },
    }),
    prisma.inspectionPlanItem.findMany({
      where: { plazaId: plaza.id },
      select: { id: true, label: true, scheduledWeeks: true },
    }),
    prisma.maintenancePlanWeekEntry.findMany({
      where: { year: currentYear, item: { plazaId: plaza.id } },
    }),
    prisma.inspectionPlanWeekEntry.findMany({
      where: { year: currentYear, item: { plazaId: plaza.id } },
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
      where: {
        item: { plazaId: plaza.id },
        OR: [{ cost: { not: null } }, { sparePartCost: { not: null } }],
      },
      select: {
        cost: true,
        costCurrency: true,
        sparePartCost: true,
        sparePartCostCurrency: true,
      },
    }),
    prisma.inspectionPlanWeekEntry.findMany({
      where: {
        item: { plazaId: plaza.id },
        OR: [{ cost: { not: null } }, { sparePartCost: { not: null } }],
      },
      select: {
        cost: true,
        costCurrency: true,
        sparePartCost: true,
        sparePartCostCurrency: true,
      },
    }),
    prisma.tenantMaintenanceItem.findMany({
      where: { tenant: { plazaId: plaza.id } },
      include: { tenant: { select: { floor: true, companyName: true } } },
    }),
    prisma.tenantMaintenanceWeekEntry.findMany({
      where: { year: currentYear, item: { tenant: { plazaId: plaza.id } } },
    }),
  ]);

  const planStats = computePlanYearStats(maintenancePlanItems, planWeekEntriesThisYear, currentYear, now);
  const inspectionStats = computePlanYearStats(
    inspectionPlanItems,
    inspectionWeekEntriesThisYear,
    currentYear,
    now
  );
  const tenantMaintenanceLabeledItems = tenantMaintenanceItems.map((i) => ({
    id: i.id,
    label: `${i.tenant.floor} · ${i.tenant.companyName} — ${i.label}`,
    scheduledWeeks: i.scheduledWeeks,
  }));
  const tenantMaintenanceStats = computePlanYearStats(
    tenantMaintenanceLabeledItems,
    tenantMaintenanceWeekEntriesThisYear,
    currentYear,
    now,
    "done"
  );

  const completedRecordCount = records.filter((r) => r.finishedAt).length;
  const ongoingRecordCount = records.length - completedRecordCount;

  // Arıza Durumu: Arıza Kayıtları'ndaki (operationType=ARIZA) devam eden/tamamlanan dağılımı.
  const arizaRecords = records.filter((r) => r.operationType === "ARIZA");
  const arizaOngoing = arizaRecords.filter((r) => !r.finishedAt).length;
  const arizaCompleted = arizaRecords.length - arizaOngoing;

  // Bakım Durumu: operationType=BAKIM artık kullanılmıyor — bakım, 3 ayrı modülle
  // (3. Firma Bakım Planı / Periyodik Muayene / Kiracı Bakımları) takip ediliyor, bu yüzden
  // her biri kendi yapıldı/yapılmadı/bekliyor dağılımıyla ayrı ayrı gösteriliyor.

  const mttaValues = records
    .map((r) => mtta(r.reportedAt, r.respondedAt))
    .filter((v): v is number => v !== null);
  const mttrValues = records
    .map((r) => mttr(r.respondedAt, r.finishedAt))
    .filter((v): v is number => v !== null);

  // Arıza kayıtlarındaki (MaintenanceRecord) yedek parça maliyeti — "Arıza Maliyetleri"
  // kutucuğunun kaynağı, yalnızca Arıza Kayıtları'na yönlendirir.
  const faultSparePartCostByCurrency = { TRY: 0, USD: 0, EUR: 0 };
  for (const r of records) {
    if (r.sparePartCost) {
      faultSparePartCostByCurrency[r.sparePartCostCurrency] += Number(r.sparePartCost);
    }
  }

  // 3. Firma Bakım Planı / Periyodik Muayene'ye girilen yedek parça maliyeti — Bakım/Yedek
  // Parça split kutucuğunun sağ yarısının kaynağı.
  const planSparePartCostByCurrency = { TRY: 0, USD: 0, EUR: 0 };
  for (const e of [...costedPlanWeekEntries, ...costedInspectionWeekEntries]) {
    if (e.sparePartCost) {
      planSparePartCostByCurrency[e.sparePartCostCurrency] += Number(e.sparePartCost);
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
        <CostBreakdownTile
          maintenanceTotals={maintenanceCostByCurrency}
          sparePartTotals={planSparePartCostByCurrency}
        />
        <FaultCostTile totals={faultSparePartCostByCurrency} />
      </div>

      <h2 className="mt-8 text-sm font-semibold text-slate-900">
        Bakım ve Muayene Planı — {currentYear} Yılı Detayı
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PlanYearDetailCard
          href="/annual-plan"
          title="3. Firma Bakım Planı"
          stats={planStats}
          currentMonthIdx={currentMonthIdx}
        />
        <PlanYearDetailCard
          href="/inspections"
          title="Periyodik (Fenni) Muayene"
          stats={inspectionStats}
          currentMonthIdx={currentMonthIdx}
        />
      </div>
      <div className="mt-4">
        <PlanYearDetailCard
          href="/tenant-maintenance"
          title="Kiracı Bakımları"
          stats={tenantMaintenanceStats}
          currentMonthIdx={currentMonthIdx}
          missedListLimit={12}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Arıza Durumu</h2>
          <div className="mt-4 space-y-3">
            <CategoricalBar
              label="Devam Eden"
              value={arizaOngoing}
              total={arizaRecords.length}
              color="var(--viz-status-warning, #f59e0b)"
            />
            <CategoricalBar
              label="Tamamlanan"
              value={arizaCompleted}
              total={arizaRecords.length}
              color="var(--viz-status-good)"
            />
          </div>
          {arizaRecords.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">Henüz arıza kaydı yok.</p>
          )}
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

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MaintenanceStatusBreakdown title="3. Firma Bakım Planı" stats={planStats} />
        <MaintenanceStatusBreakdown title="Fenni Muayeneler" stats={inspectionStats} />
        <MaintenanceStatusBreakdown title="Kiracı Bakımları" stats={tenantMaintenanceStats} />
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

function PlanYearDetailCard({
  href,
  title,
  stats,
  currentMonthIdx,
  missedListLimit = 5,
}: {
  href: string;
  title: string;
  stats: PlanYearStats;
  currentMonthIdx: number;
  missedListLimit?: number;
}) {
  const donePct =
    stats.totalScheduled > 0 ? Math.round((stats.done / stats.totalScheduled) * 100) : 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <Link href={href} className="text-sm font-semibold text-slate-900 hover:underline">
          {title}
        </Link>
        <span className="text-xs text-slate-400">{stats.totalScheduled} planlı</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <span>
          <span className="font-semibold tabular-nums" style={{ color: "var(--viz-status-good)" }}>
            {stats.done}
          </span>{" "}
          <span className="text-slate-500">yapıldı</span>
        </span>
        <span>
          <span
            className="font-semibold tabular-nums"
            style={{ color: "var(--viz-status-critical)" }}
          >
            {stats.missed}
          </span>{" "}
          <span className="text-slate-500">yapılmadı</span>
        </span>
        <span>
          <span className="font-semibold tabular-nums text-amber-500">{stats.pending}</span>{" "}
          <span className="text-slate-500">bekliyor</span>
        </span>
        <span className="text-slate-400">({donePct}% tamamlandı)</span>
      </div>

      <div className="mt-4 grid grid-cols-12 gap-1">
        {MONTH_NAMES.map((name, i) => {
          const total = stats.monthlyDone[i] + stats.monthlyMissed[i] + stats.monthlyPending[i];
          return (
            <div key={name} className="flex flex-col items-center gap-1" title={name}>
              <div className="flex h-10 w-full flex-col-reverse overflow-hidden rounded bg-slate-100">
                {total > 0 && (
                  <>
                    {stats.monthlyDone[i] > 0 && (
                      <div
                        style={{
                          height: `${(stats.monthlyDone[i] / total) * 100}%`,
                          backgroundColor: "var(--viz-status-good)",
                        }}
                      />
                    )}
                    {stats.monthlyMissed[i] > 0 && (
                      <div
                        style={{
                          height: `${(stats.monthlyMissed[i] / total) * 100}%`,
                          backgroundColor: "var(--viz-status-critical)",
                        }}
                      />
                    )}
                    {stats.monthlyPending[i] > 0 && (
                      <div
                        style={{
                          height: `${(stats.monthlyPending[i] / total) * 100}%`,
                          backgroundColor: "var(--viz-status-warning, #f59e0b)",
                        }}
                      />
                    )}
                  </>
                )}
              </div>
              <span
                className={`text-[9px] ${i === currentMonthIdx ? "font-bold text-slate-900" : "text-slate-400"}`}
              >
                {name.slice(0, 3)}
              </span>
            </div>
          );
        })}
      </div>

      {stats.missedList.length > 0 && (
        <div className="mt-4 rounded-md border border-red-100 bg-red-50 p-3">
          <p className="text-xs font-medium text-red-700">
            Yapılmadı işaretlenen {stats.missedList.length} kayıt
          </p>
          <ul
            className={`mt-1.5 grid grid-cols-1 gap-1 ${missedListLimit > 5 ? "sm:grid-cols-2 lg:grid-cols-3" : ""}`}
          >
            {stats.missedList.slice(0, missedListLimit).map((m) => (
              <li key={`${m.itemId}-${m.week}`} className="text-xs text-red-600">
                {m.itemLabel} — {m.month} ({m.week}. hafta)
              </li>
            ))}
            {stats.missedList.length > missedListLimit && (
              <li className="text-xs text-red-500">
                + {stats.missedList.length - missedListLimit} kayıt daha
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function MaintenanceStatusBreakdown({ title, stats }: { title: string; stats: PlanYearStats }) {
  const total = stats.done + stats.missed + stats.pending;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 space-y-3">
        <CategoricalBar
          label="Yapıldı"
          value={stats.done}
          total={total}
          color="var(--viz-status-good)"
        />
        <CategoricalBar
          label="Yapılmadı"
          value={stats.missed}
          total={total}
          color="var(--viz-status-critical)"
        />
        <CategoricalBar
          label="Bekliyor"
          value={stats.pending}
          total={total}
          color="var(--viz-status-warning, #f59e0b)"
        />
      </div>
      {total === 0 && <p className="mt-2 text-sm text-slate-500">Henüz planlı kayıt yok.</p>}
    </div>
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

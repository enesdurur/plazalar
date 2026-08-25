import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { mtta, mttr, average, formatMinutes } from "@/lib/kpi";
import { StatTile } from "@/components/stat-tile";
import { BarBreakdown } from "@/components/bar-breakdown";

export default async function DashboardPage() {
  const records = await prisma.maintenanceRecord.findMany({
    include: { machine: true },
  });

  const machines = await prisma.machine.findMany({ include: { line: true } });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [
    inspectionTotal,
    inspectionExpired,
    calibrationTotal,
    calibrationExpired,
    verificationTotal,
    verificationExpired,
    machineCount,
    planEntriesThisMonth,
  ] = await Promise.all([
    prisma.periodicInspection.count(),
    prisma.periodicInspection.count({ where: { nextInspectionDate: { lt: now } } }),
    prisma.calibration.count(),
    prisma.calibration.count({ where: { nextCalibrationDate: { lt: now } } }),
    prisma.verification.count(),
    prisma.verification.count({ where: { nextVerificationDate: { lt: now } } }),
    prisma.machine.count(),
    prisma.maintenancePlanEntry.findMany({
      where: { year: currentYear, month: currentMonth },
    }),
  ]);

  const planDoneThisMonth = planEntriesThisMonth.filter((e) => e.completed === true).length;
  const planMissedThisMonth = planEntriesThisMonth.filter((e) => e.completed === false).length;

  const arizaCount = records.filter((r) => r.operationType === "ARIZA").length;
  const bakimCount = records.filter((r) => r.operationType === "BAKIM").length;

  const mttaValues = records
    .map((r) => mtta(r.reportedAt, r.respondedAt))
    .filter((v): v is number => v !== null);
  const mttrValues = records
    .map((r) => mttr(r.respondedAt, r.finishedAt))
    .filter((v): v is number => v !== null);

  const totalSparePartCost = records.reduce(
    (sum, r) => sum + (r.sparePartCost ? Number(r.sparePartCost) : 0),
    0
  );

  const machineLine = new Map(machines.map((m) => [m.id, m.line?.name ?? "Belirsiz"]));

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

  const recordsByLine = new Map<string, number>();
  for (const r of records) {
    const line = machineLine.get(r.machineId) ?? "Belirsiz";
    recordsByLine.set(line, (recordsByLine.get(line) ?? 0) + 1);
  }
  const lineBreakdown = [...recordsByLine.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Panel</h1>
      <p className="mt-1 text-sm text-slate-500">
        Teknik hizmetler arıza ve bakım performans özeti.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Toplam Kayıt" value={records.length.toString()} />
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
        <StatTile
          label="Toplam Yedek Parça Maliyeti"
          value={totalSparePartCost.toLocaleString("tr-TR", {
            style: "currency",
            currency: "TRY",
            maximumFractionDigits: 0,
          })}
        />
      </div>

      <h2 className="mt-8 text-sm font-semibold text-slate-900">Uygunluk Durumu</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ComplianceTile
          href="/inspections"
          label="Periyodik Muayene"
          total={inspectionTotal}
          expired={inspectionExpired}
        />
        <ComplianceTile
          href="/calibrations"
          label="Kalibrasyon"
          total={calibrationTotal}
          expired={calibrationExpired}
        />
        <ComplianceTile
          href="/verifications"
          label="Doğrulama"
          total={verificationTotal}
          expired={verificationExpired}
        />
        <Link
          href="/annual-plan"
          className="block rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-300"
        >
          <p className="text-sm font-medium text-slate-500">Yıllık Bakım Planı (Bu Ay)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className="text-2xl font-semibold tabular-nums"
              style={{
                color:
                  planMissedThisMonth === 0
                    ? "var(--viz-status-good)"
                    : "var(--viz-status-critical)",
              }}
            >
              {planDoneThisMonth}
            </span>
            <span className="text-sm text-slate-400">
              yapıldı, {planMissedThisMonth} yapılmadı / {machineCount} makine
            </span>
          </div>
        </Link>
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
          <h2 className="text-sm font-semibold text-slate-900">Hat Bazında Kayıt Sayısı</h2>
          <BarBreakdown
            items={lineBreakdown.map(([label, value]) => ({ label, value }))}
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-2">
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
    </div>
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

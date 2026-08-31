import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { toggleTenantMaintenanceWeekEntry } from "./actions";
import { ExportLink } from "@/components/export-link";
import { PrintButton } from "@/components/print-button";
import { MONTH_NAMES, MONTH_WEEK_RANGES, TOTAL_WEEKS, isPastWeek } from "@/lib/plan/weeks";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kiracı Bakımları",
};

const CELL_STYLES = {
  DONE: "bg-green-100 text-green-700 hover:bg-green-200",
  MISSED: "bg-red-100 text-red-700 hover:bg-red-200",
  EMPTY: "bg-amber-50 text-amber-300 hover:bg-amber-100",
};

const KAT_W = 130;
const KIRACI_W = 220;
const TUR_W = 130;
const WEEK_W = 32;

export default async function TenantMaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const year = params.year ? parseInt(params.year, 10) : new Date().getFullYear();

  const session = await auth();
  const writable = canWrite(session?.user.role);
  const plaza = await getSelectedPlaza();
  const now = new Date();

  const [items, entries] = await Promise.all([
    prisma.tenantMaintenanceItem.findMany({
      where: { tenant: { plazaId: plaza.id } },
      include: { tenant: true },
      orderBy: [{ tenant: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    }),
    prisma.tenantMaintenanceWeekEntry.findMany({
      where: { year, item: { tenant: { plazaId: plaza.id } } },
    }),
  ]);

  const entryMap = new Map(entries.map((e) => [`${e.itemId}-${e.week}`, e]));

  const monthlyDone = Array(12).fill(0);
  const monthlyMissed = Array(12).fill(0);
  for (const e of entries) {
    const monthIdx = MONTH_WEEK_RANGES.findIndex(
      (r) => e.week >= r.startWeek && e.week <= r.endWeek
    );
    if (monthIdx === -1) continue;
    if (e.completed === true) monthlyDone[monthIdx]++;
    if (e.completed === false) monthlyMissed[monthIdx]++;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Kiracı Bakımları</h1>
          <p className="mt-1 text-sm text-slate-500">
            İşaretli haftada tıklayarak durumu değiştirin: bekliyor → yapıldı → yapılmadı →
            bekliyor. Şimdilik Fancoil Bakımı (yılda 1 kez, Haziran ortası) ve Elektrik Bakımı
            (yılda 1 kez, Mayıs ortası).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 print:hidden">
            <PrintButton />
            <ExportLink href={`/api/export/tenant-maintenance?year=${year}`} />
            <Link
              href={`/tenant-maintenance?year=${year - 1}`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              ← {year - 1}
            </Link>
          </div>
          <span className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white">
            {year}
          </span>
          <Link
            href={`/tenant-maintenance?year=${year + 1}`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 print:hidden"
          >
            {year + 1} →
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table
          className="divide-y divide-slate-200 text-sm"
          style={{ tableLayout: "fixed", width: KAT_W + KIRACI_W + TUR_W + TOTAL_WEEKS * WEEK_W }}
        >
          <colgroup>
            <col style={{ width: KAT_W }} />
            <col style={{ width: KIRACI_W }} />
            <col style={{ width: TUR_W }} />
            {Array.from({ length: TOTAL_WEEKS }, (_, i) => (
              <col key={i} style={{ width: WEEK_W }} />
            ))}
          </colgroup>
          <thead className="bg-slate-50">
            <tr>
              <th
                rowSpan={2}
                style={{ width: KAT_W }}
                className="bg-slate-50 px-3 py-2 text-left align-bottom font-medium text-slate-600"
              >
                Kat
              </th>
              <th
                rowSpan={2}
                style={{ width: KIRACI_W }}
                className="bg-slate-50 px-3 py-2 text-left align-bottom font-medium text-slate-600"
              >
                Kiracı
              </th>
              <th
                rowSpan={2}
                style={{ width: TUR_W }}
                className="border-r border-slate-200 bg-slate-50 px-3 py-2 text-left align-bottom font-medium text-slate-600"
              >
                Bakım Türü
              </th>
              {MONTH_NAMES.map((name, i) => {
                const range = MONTH_WEEK_RANGES[i];
                return (
                  <th
                    key={name}
                    colSpan={range.endWeek - range.startWeek + 1}
                    className="border-l border-slate-200 px-1 py-1 text-center text-[11px] font-semibold text-slate-500"
                  >
                    {name}
                  </th>
                );
              })}
            </tr>
            <tr>
              {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((week) => (
                <th
                  key={week}
                  className="w-8 px-0.5 py-1.5 text-center text-[10px] font-normal text-slate-400"
                >
                  {week}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const scheduled = new Set(item.scheduledWeeks);
              return (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td
                    style={{ width: KAT_W }}
                    className="bg-white px-3 py-2 text-slate-600"
                  >
                    {item.tenant.floor}
                  </td>
                  <td
                    style={{ width: KIRACI_W }}
                    className="bg-white px-3 py-2 font-medium text-slate-900"
                  >
                    {item.tenant.companyName}
                  </td>
                  <td
                    style={{ width: TUR_W }}
                    className="border-r border-slate-200 bg-white px-3 py-2 text-slate-600"
                  >
                    {item.label}
                  </td>
                  {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((week) => {
                    if (!scheduled.has(week)) {
                      return <td key={week} className="border-l border-slate-100 px-0.5 py-1" />;
                    }

                    const entry = entryMap.get(`${item.id}-${week}`);
                    const completed =
                      entry?.completed ?? (isPastWeek(year, week, now) ? true : null);
                    const style =
                      completed === true
                        ? CELL_STYLES.DONE
                        : completed === false
                          ? CELL_STYLES.MISSED
                          : CELL_STYLES.EMPTY;
                    const label = completed === true ? "✓" : completed === false ? "✕" : "●";

                    if (!writable) {
                      return (
                        <td
                          key={week}
                          className="border-l border-slate-100 px-0.5 py-1 text-center"
                        >
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs ${style}`}
                          >
                            {label}
                          </span>
                        </td>
                      );
                    }

                    return (
                      <td key={week} className="border-l border-slate-100 px-0.5 py-1 text-center">
                        <form
                          action={toggleTenantMaintenanceWeekEntry.bind(null, item.id, year, week)}
                        >
                          <button
                            type="submit"
                            className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-medium transition-colors ${style}`}
                          >
                            {label}
                          </button>
                        </form>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={TOTAL_WEEKS + 3} className="px-4 py-8 text-center text-slate-500">
                  Henüz kiracı bakım kalemi yok.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-slate-50">
            <tr>
              <td
                colSpan={3}
                className="bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500"
              >
                Yapıldı / Yapılmadı
              </td>
              {MONTH_NAMES.map((name, i) => {
                const range = MONTH_WEEK_RANGES[i];
                return (
                  <td
                    key={name}
                    colSpan={range.endWeek - range.startWeek + 1}
                    className="border-l border-slate-200 px-1 py-2 text-center text-[11px]"
                  >
                    <span className="font-medium text-green-600">{monthlyDone[i]}</span>
                    <span className="text-slate-400"> / </span>
                    <span className="font-medium text-red-600">{monthlyMissed[i]}</span>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

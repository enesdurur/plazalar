import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { togglePlanWeekEntry } from "./actions";
import { ExportLink } from "@/components/export-link";
import { PrintButton } from "@/components/print-button";
import { formatCostAmount } from "@/components/spare-part-cost-tile";
import { MONTH_NAMES, MONTH_WEEK_RANGES, TOTAL_WEEKS, isPastWeek } from "@/lib/plan/weeks";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "3. Firma Bakım Planı",
};

const CELL_STYLES = {
  DONE: "bg-green-100 text-green-700 hover:bg-green-200",
  MISSED: "bg-red-100 text-red-700 hover:bg-red-200",
  EMPTY: "bg-amber-50 text-amber-300 hover:bg-amber-100",
};

// Sütun genişlikleri (px) — colgroup ile birlikte sabit tablo düzeni sağlar.
const SIRA_W = 48;
const LABEL_W = 260;
const FIRMA_W = 150;
const SAYI_W = 84;
const WEEK_W = 32;

export default async function AnnualPlanPage({
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
    prisma.maintenancePlanItem.findMany({
      where: { plazaId: plaza.id },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.maintenancePlanWeekEntry.findMany({
      where: { year, item: { plazaId: plaza.id } },
    }),
  ]);

  const entryMap = new Map(entries.map((e) => [`${e.itemId}-${e.week}`, e]));

  const monthlyDone = Array(12).fill(0);
  const monthlyMissed = Array(12).fill(0);
  for (const item of items) {
    for (const week of item.scheduledWeeks) {
      const entry = entryMap.get(`${item.id}-${week}`);
      const completed = entry?.completed ?? (isPastWeek(year, week, now) ? false : null);
      const monthIdx = MONTH_WEEK_RANGES.findIndex(
        (r) => week >= r.startWeek && week <= r.endWeek
      );
      if (monthIdx === -1) continue;
      if (completed === true) monthlyDone[monthIdx]++;
      if (completed === false) monthlyMissed[monthIdx]++;
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">3. Firma Bakım Planı</h1>
          <p className="mt-1 text-sm text-slate-500">
            Excel&apos;de işaretli haftalarda tıklayarak durumu değiştirin: bekliyor → yapıldı →
            yapılmadı → bekliyor. Geçmiş aylardaki işaretli haftalar elle işaretlenmemişse
            otomatik yapılmadı kabul edilir.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <PrintButton />
            <ExportLink href={`/api/export/annual-plan?year=${year}`} />
            <Link
              href={`/annual-plan?year=${year - 1}`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              ← {year - 1}
            </Link>
          </div>
          <span className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white">
            {year}
          </span>
          <Link
            href={`/annual-plan?year=${year + 1}`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 print:hidden"
          >
            {year + 1} →
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table
          className="divide-y divide-slate-200 text-sm"
          style={{ tableLayout: "fixed", width: SIRA_W + LABEL_W + FIRMA_W + SAYI_W + TOTAL_WEEKS * WEEK_W }}
        >
          <colgroup>
            <col style={{ width: SIRA_W }} />
            <col style={{ width: LABEL_W }} />
            <col style={{ width: FIRMA_W }} />
            <col style={{ width: SAYI_W }} />
            {Array.from({ length: TOTAL_WEEKS }, (_, i) => (
              <col key={i} style={{ width: WEEK_W }} />
            ))}
          </colgroup>
          <thead className="bg-slate-50">
            <tr>
              <th
                rowSpan={2}
                style={{ width: SIRA_W }}
                className="bg-slate-50 px-2 py-2 text-center align-bottom font-medium text-slate-600"
              >
                Sıra No
              </th>
              <th
                rowSpan={2}
                style={{ width: LABEL_W }}
                className="bg-slate-50 px-3 py-2 text-left align-bottom font-medium text-slate-600"
              >
                Bakım
              </th>
              <th
                rowSpan={2}
                style={{ width: FIRMA_W }}
                className="bg-slate-50 px-3 py-2 text-left align-bottom font-medium text-slate-600"
              >
                Bakımı Yapacak Firma
              </th>
              <th
                rowSpan={2}
                style={{ width: SAYI_W }}
                className="border-r border-slate-200 bg-slate-50 px-2 py-2 text-center align-bottom font-medium text-slate-600"
              >
                Bakım Sayısı
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
            {items.map((item, idx) => {
              const scheduled = new Set(item.scheduledWeeks);
              return (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td
                    style={{ width: SIRA_W }}
                    className="bg-white px-2 py-2 text-center text-slate-500"
                  >
                    {idx + 1}
                  </td>
                  <td
                    style={{ width: LABEL_W }}
                    className="bg-white px-3 py-2 font-medium text-slate-900"
                  >
                    {item.label}
                  </td>
                  <td
                    style={{ width: FIRMA_W }}
                    className="bg-white px-3 py-2 text-slate-600"
                  >
                    {item.company}
                  </td>
                  <td
                    style={{ width: SAYI_W }}
                    className="border-r border-slate-200 bg-white px-2 py-2 text-center text-slate-600"
                  >
                    {item.yearlyCount ?? ""}
                  </td>
                  {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((week) => {
                    if (!scheduled.has(week)) {
                      return <td key={week} className="border-l border-slate-100 px-0.5 py-1" />;
                    }

                    const entry = entryMap.get(`${item.id}-${week}`);
                    const completed =
                      entry?.completed ?? (isPastWeek(year, week, now) ? false : null);
                    const style =
                      completed === true
                        ? CELL_STYLES.DONE
                        : completed === false
                          ? CELL_STYLES.MISSED
                          : CELL_STYLES.EMPTY;
                    const label = completed === true ? "✓" : completed === false ? "✕" : "●";
                    const costLabel = entry?.cost
                      ? formatCostAmount(Number(entry.cost), entry.costCurrency)
                      : null;
                    const sparePartLabel = entry?.sparePartCost
                      ? formatCostAmount(Number(entry.sparePartCost), entry.sparePartCostCurrency)
                      : null;

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
                        <form action={togglePlanWeekEntry.bind(null, item.id, year, week)}>
                          <button
                            type="submit"
                            title={costLabel ?? undefined}
                            className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-medium transition-colors ${style}`}
                          >
                            {label}
                          </button>
                        </form>
                        {entry && (
                          <Link
                            href={`/annual-plan/entries/${entry.id}/edit`}
                            title={
                              costLabel
                                ? entry.approved
                                  ? "Onaylandı"
                                  : "Bütçe onayı bekliyor"
                                : undefined
                            }
                            className={`mt-0.5 block whitespace-nowrap text-[9px] hover:text-slate-600 print:hidden ${
                              costLabel && !entry.approved
                                ? "font-medium text-amber-500"
                                : "text-slate-400"
                            }`}
                          >
                            {costLabel ?? "+"}
                          </Link>
                        )}
                        {sparePartLabel && (
                          <Link
                            href={`/annual-plan/entries/${entry!.id}/edit`}
                            title={`Yedek parça: ${sparePartLabel}${entry!.approved ? " (onaylandı)" : " (onay bekliyor)"}`}
                            className={`mt-0.5 block whitespace-nowrap text-[9px] font-medium print:hidden ${
                              entry!.approved
                                ? "text-emerald-600 hover:text-emerald-700"
                                : "text-amber-600 hover:text-amber-700"
                            }`}
                          >
                            🔧 {sparePartLabel}
                          </Link>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={TOTAL_WEEKS + 4} className="px-4 py-8 text-center text-slate-500">
                  Henüz bakım kalemi yok.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-slate-50">
            <tr>
              <td
                colSpan={4}
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

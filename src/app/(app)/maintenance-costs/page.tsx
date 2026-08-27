import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { ExportLink } from "@/components/export-link";
import { PrintButton } from "@/components/print-button";
import { formatCostAmount } from "@/components/spare-part-cost-tile";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bakım Maliyetleri",
};

const MONTH_NAMES = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

export default async function MaintenanceCostsPage() {
  const plaza = await getSelectedPlaza();

  const [inspections, planEntries] = await Promise.all([
    prisma.periodicInspection.findMany({
      where: { plazaId: plaza.id, cost: { not: null } },
      orderBy: { inspectionDate: "desc" },
    }),
    prisma.maintenancePlanEntry.findMany({
      where: { cost: { not: null }, machine: { plazaId: plaza.id } },
      include: { machine: true },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    }),
  ]);

  const totals = { TRY: 0, USD: 0, EUR: 0 };
  for (const i of inspections) {
    if (i.cost) totals[i.costCurrency] += Number(i.cost);
  }
  for (const e of planEntries) {
    if (e.cost) totals[e.costCurrency] += Number(e.cost);
  }

  const totalCount = inspections.length + planEntries.length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← Panel
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">Bakım Maliyetleri</h1>
          <p className="mt-1 text-sm text-slate-500">
            Periyodik Muayene ve Yıllık Bakım Planı&apos;na girilen maliyetler · Toplam{" "}
            {totalCount} kayıt · {formatCostAmount(totals.TRY, "TRY")}
            {totals.USD > 0 && ` · ${formatCostAmount(totals.USD, "USD")}`}
            {totals.EUR > 0 && ` · ${formatCostAmount(totals.EUR, "EUR")}`}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <PrintButton />
          <ExportLink href="/api/export/maintenance-costs" />
        </div>
      </div>

      <h2 className="mt-6 text-sm font-semibold text-slate-900">Yıllık Bakım Planı</h2>
      <div className="mt-3 max-h-[50vh] overflow-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Makine</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Ay / Yıl</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Not</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Tutar</th>
              <th className="px-4 py-3 print:hidden" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {planEntries.map((e) => (
              <tr key={e.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{e.machine.name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {MONTH_NAMES[e.month - 1]} {e.year}
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-slate-600">{e.note ?? "-"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                  {formatCostAmount(Number(e.cost), e.costCurrency)}
                </td>
                <td className="px-4 py-3 text-right print:hidden">
                  <Link
                    href={`/annual-plan/entries/${e.id}/edit`}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Düzenle
                  </Link>
                </td>
              </tr>
            ))}
            {planEntries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Henüz maliyetli bir yıllık bakım kaydı yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-sm font-semibold text-slate-900">Periyodik Muayene</h2>
      <div className="mt-3 max-h-[50vh] overflow-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Ekipman</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Muayene Tarihi</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Tutar</th>
              <th className="px-4 py-3 print:hidden" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inspections.map((i) => (
              <tr key={i.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{i.name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {i.inspectionDate ? i.inspectionDate.toLocaleDateString("tr-TR") : "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                  {formatCostAmount(Number(i.cost), i.costCurrency)}
                </td>
                <td className="px-4 py-3 text-right print:hidden">
                  <Link
                    href={`/inspections/${i.id}/edit`}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Düzenle
                  </Link>
                </td>
              </tr>
            ))}
            {inspections.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Henüz maliyetli bir periyodik muayene kaydı yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

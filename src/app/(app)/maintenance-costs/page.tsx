import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { ExportLink } from "@/components/export-link";
import { PrintButton } from "@/components/print-button";
import { formatCostAmount } from "@/components/spare-part-cost-tile";
import { PlanEntriesTable } from "./plan-entries-table";
import { InspectionsCostTable } from "./inspections-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bakım Maliyetleri",
};

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
      <div className="mt-3">
        <PlanEntriesTable entries={planEntries} />
      </div>

      <h2 className="mt-8 text-sm font-semibold text-slate-900">Periyodik Muayene</h2>
      <div className="mt-3">
        <InspectionsCostTable items={inspections} />
      </div>
    </div>
  );
}

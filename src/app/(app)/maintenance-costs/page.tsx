import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canApprove } from "@/lib/permissions";
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
  const session = await auth();
  const approver = canApprove(session?.user.role);
  const plaza = await getSelectedPlaza();

  const [planEntries, inspectionEntries] = await Promise.all([
    prisma.maintenancePlanWeekEntry.findMany({
      where: {
        item: { plazaId: plaza.id },
        OR: [{ cost: { not: null } }, { sparePartCost: { not: null } }],
      },
      include: { item: true },
      orderBy: [{ year: "desc" }, { week: "desc" }],
    }),
    prisma.inspectionPlanWeekEntry.findMany({
      where: {
        item: { plazaId: plaza.id },
        OR: [{ cost: { not: null } }, { sparePartCost: { not: null } }],
      },
      include: { item: true },
      orderBy: [{ year: "desc" }, { week: "desc" }],
    }),
  ]);

  const totals = { TRY: 0, USD: 0, EUR: 0 };
  const sparePartTotals = { TRY: 0, USD: 0, EUR: 0 };
  for (const e of [...planEntries, ...inspectionEntries]) {
    if (e.cost) totals[e.costCurrency] += Number(e.cost);
    if (e.sparePartCost) sparePartTotals[e.sparePartCostCurrency] += Number(e.sparePartCost);
  }

  const totalCount = planEntries.length + inspectionEntries.length;

  // Prisma Decimal alanları Client Component'lere doğrudan aktarılamaz — düz sayıya çeviriyoruz.
  const planEntriesSerialized = planEntries.map((e) => ({
    ...e,
    cost: e.cost != null ? Number(e.cost) : null,
    sparePartCost: e.sparePartCost != null ? Number(e.sparePartCost) : null,
  }));
  const inspectionEntriesSerialized = inspectionEntries.map((e) => ({
    ...e,
    cost: e.cost != null ? Number(e.cost) : null,
    sparePartCost: e.sparePartCost != null ? Number(e.sparePartCost) : null,
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← Panel
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">Bakım Maliyetleri</h1>
          <p className="mt-1 text-sm text-slate-500">
            3. Firma Bakım Planı ve Periyodik (Fenni) Muayene&apos;ye girilen maliyetler · Toplam{" "}
            {totalCount} kayıt · Bakım: {formatCostAmount(totals.TRY, "TRY")}
            {totals.USD > 0 && ` · ${formatCostAmount(totals.USD, "USD")}`}
            {totals.EUR > 0 && ` · ${formatCostAmount(totals.EUR, "EUR")}`}
            {(sparePartTotals.TRY > 0 || sparePartTotals.USD > 0 || sparePartTotals.EUR > 0) && (
              <>
                {" "}
                · Yedek Parça: {formatCostAmount(sparePartTotals.TRY, "TRY")}
                {sparePartTotals.USD > 0 && ` · ${formatCostAmount(sparePartTotals.USD, "USD")}`}
                {sparePartTotals.EUR > 0 && ` · ${formatCostAmount(sparePartTotals.EUR, "EUR")}`}
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <PrintButton />
          <ExportLink href="/api/export/maintenance-costs" />
        </div>
      </div>

      <h2 className="mt-6 text-sm font-semibold text-slate-900">3. Firma Bakım Planı</h2>
      <div className="mt-3">
        <PlanEntriesTable entries={planEntriesSerialized} approver={approver} />
      </div>

      <h2 className="mt-8 text-sm font-semibold text-slate-900">Periyodik (Fenni) Muayene</h2>
      <div className="mt-3">
        <InspectionsCostTable entries={inspectionEntriesSerialized} approver={approver} />
      </div>
    </div>
  );
}

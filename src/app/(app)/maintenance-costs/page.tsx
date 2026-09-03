import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { ExportLink } from "@/components/export-link";
import { PrintButton } from "@/components/print-button";
import { formatCostAmount } from "@/components/spare-part-cost-tile";
import { CostRecordsTable, type CostRecordRow } from "./cost-records-table";
import { deleteMaintenancePlanEntry } from "./actions";
import { deletePlanWeekEntry } from "../annual-plan/actions";
import { deleteInspection, deleteInspectionWeekEntry } from "../inspections/actions";
import { monthOfWeek, MONTH_NAMES } from "@/lib/plan/weeks";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bakım Maliyetleri",
};

export default async function MaintenanceCostsPage() {
  const session = await auth();
  const writable = canWrite(session?.user.role);
  const deletable = canDelete(session?.user.role);
  const plaza = await getSelectedPlaza();

  const [planEntries, inspectionEntries, legacyInspections, legacyPlanEntries] =
    await Promise.all([
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
      // Haftalık matrise geçmeden önceki eski kayıtlar. Panel'deki "Bakım Maliyetleri"
      // toplamına dahil oldukları için, aşağıda normal kayıtlarla aynı listeye (ayrı bir
      // "eski kayıtlar" başlığı açmadan) karıştırılıyorlar — aksi halde Panel'de görülen
      // toplamla bu sayfa uyuşmaz.
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
  const sparePartTotals = { TRY: 0, USD: 0, EUR: 0 };
  for (const e of [...planEntries, ...inspectionEntries]) {
    if (e.cost) totals[e.costCurrency] += Number(e.cost);
    if (e.sparePartCost) sparePartTotals[e.sparePartCostCurrency] += Number(e.sparePartCost);
  }
  for (const r of [...legacyInspections, ...legacyPlanEntries]) {
    if (r.cost) totals[r.costCurrency] += Number(r.cost);
  }

  const totalCount =
    planEntries.length + inspectionEntries.length + legacyInspections.length + legacyPlanEntries.length;

  const planRows: CostRecordRow[] = [
    ...planEntries.map((e) => ({
      row: {
        id: e.id,
        label: e.item.label,
        monthYearLabel: `${MONTH_NAMES[monthOfWeek(e.week) - 1]} ${e.year} (${e.week}. hafta)`,
        cost: e.cost != null ? Number(e.cost) : null,
        costCurrency: e.costCurrency,
        sparePartCost: e.sparePartCost != null ? Number(e.sparePartCost) : null,
        sparePartCostCurrency: e.sparePartCostCurrency,
        sparePartNote: e.sparePartNote,
        editHref: `/annual-plan/entries/${e.id}/edit`,
        deleteAction: deletePlanWeekEntry.bind(null, e.id),
      },
      sortKey: e.year * 100 + monthOfWeek(e.week),
    })),
    ...legacyPlanEntries.map((e) => ({
      row: {
        id: e.id,
        label: e.machine.name,
        monthYearLabel: `${MONTH_NAMES[e.month - 1]} ${e.year}`,
        cost: e.cost != null ? Number(e.cost) : null,
        costCurrency: e.costCurrency,
        sparePartCost: null,
        sparePartCostCurrency: "TRY" as const,
        sparePartNote: null,
        editHref: `/maintenance-costs/plan-entries/${e.id}/edit`,
        deleteAction: deleteMaintenancePlanEntry.bind(null, e.id),
      },
      sortKey: e.year * 100 + e.month,
    })),
  ]
    .sort((a, b) => b.sortKey - a.sortKey)
    .map((x) => x.row);

  const inspectionRows: CostRecordRow[] = [
    ...inspectionEntries.map((e) => ({
      row: {
        id: e.id,
        label: e.item.label,
        monthYearLabel: `${MONTH_NAMES[monthOfWeek(e.week) - 1]} ${e.year} (${e.week}. hafta)`,
        cost: e.cost != null ? Number(e.cost) : null,
        costCurrency: e.costCurrency,
        sparePartCost: e.sparePartCost != null ? Number(e.sparePartCost) : null,
        sparePartCostCurrency: e.sparePartCostCurrency,
        sparePartNote: e.sparePartNote,
        editHref: `/inspections/entries/${e.id}/edit`,
        deleteAction: deleteInspectionWeekEntry.bind(null, e.id),
      },
      sortKey: e.year * 100 + monthOfWeek(e.week),
    })),
    ...legacyInspections.map((r) => ({
      row: {
        id: r.id,
        label: r.name,
        monthYearLabel: r.inspectionDate
          ? `${MONTH_NAMES[r.inspectionDate.getMonth()]} ${r.inspectionDate.getFullYear()}`
          : "-",
        cost: r.cost != null ? Number(r.cost) : null,
        costCurrency: r.costCurrency,
        sparePartCost: null,
        sparePartCostCurrency: "TRY" as const,
        sparePartNote: null,
        editHref: `/inspections/${r.id}/edit`,
        deleteAction: deleteInspection.bind(null, r.id),
      },
      sortKey: r.inspectionDate
        ? r.inspectionDate.getFullYear() * 100 + (r.inspectionDate.getMonth() + 1)
        : 0,
    })),
  ]
    .sort((a, b) => b.sortKey - a.sortKey)
    .map((x) => x.row);

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
        <CostRecordsTable
          rows={planRows}
          itemColumnHeader="Bakım Kalemi"
          emptyMessage="Henüz maliyetli bir yıllık bakım kaydı yok."
          writable={writable}
          deletable={deletable}
        />
      </div>

      <h2 className="mt-8 text-sm font-semibold text-slate-900">Periyodik (Fenni) Muayene</h2>
      <div className="mt-3">
        <CostRecordsTable
          rows={inspectionRows}
          itemColumnHeader="Fenni Muayene Kalemi"
          emptyMessage="Henüz maliyetli bir fenni muayene kaydı yok."
          writable={writable}
          deletable={deletable}
        />
      </div>
    </div>
  );
}

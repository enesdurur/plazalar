import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { updateInspectionWeekEntryCost } from "../../../actions";
import { WeekEntryCostForm } from "@/components/week-entry-cost-form";
import { monthOfWeek, MONTH_NAMES } from "@/lib/plan/weeks";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fenni Muayene Maliyeti",
};

export default async function EditInspectionWeekEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plaza = await getSelectedPlaza();

  const entry = await prisma.inspectionPlanWeekEntry.findFirst({
    where: { id, item: { plazaId: plaza.id } },
    include: { item: true },
  });

  if (!entry) notFound();

  const updateWithId = updateInspectionWeekEntryCost.bind(null, id);
  const statusLabel =
    entry.completed === true ? "Yapıldı" : entry.completed === false ? "Yapılmadı" : "Boş";
  const monthName = MONTH_NAMES[monthOfWeek(entry.week) - 1];

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Fenni Muayene Maliyeti</h1>
      <p className="mt-1 text-sm text-slate-500">
        {entry.item.label} · {monthName} {entry.year} ({entry.week}. hafta) · Durum: {statusLabel}
      </p>

      <WeekEntryCostForm
        action={updateWithId}
        defaults={{
          cost: entry.cost?.toString(),
          costCurrency: entry.costCurrency,
          costExchangeRate: entry.costExchangeRate?.toString(),
          note: entry.note,
          sparePartCost: entry.sparePartCost?.toString(),
          sparePartCostCurrency: entry.sparePartCostCurrency,
          sparePartExchangeRate: entry.sparePartExchangeRate?.toString(),
          sparePartNote: entry.sparePartNote,
        }}
      />
    </div>
  );
}

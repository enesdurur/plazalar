import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canApprove } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { updatePlanWeekEntryCost, setPlanWeekEntryApproval } from "../../../actions";
import { WeekEntryCostForm } from "@/components/week-entry-cost-form";
import { ApprovalControl } from "@/components/approval-control";
import { monthOfWeek, MONTH_NAMES } from "@/lib/plan/weeks";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bakım Maliyeti",
};

export default async function EditPlanWeekEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const approver = canApprove(session?.user.role);
  const plaza = await getSelectedPlaza();

  const entry = await prisma.maintenancePlanWeekEntry.findFirst({
    where: { id, item: { plazaId: plaza.id } },
    include: { item: true },
  });

  if (!entry) notFound();

  const updateWithId = updatePlanWeekEntryCost.bind(null, id);
  const statusLabel =
    entry.completed === true ? "Yapıldı" : entry.completed === false ? "Yapılmadı" : "Boş";
  const monthName = MONTH_NAMES[monthOfWeek(entry.week) - 1];
  const hasCost = entry.cost != null || entry.sparePartCost != null;

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Bakım Maliyeti</h1>
      <p className="mt-1 text-sm text-slate-500">
        {entry.item.label} · {monthName} {entry.year} ({entry.week}. hafta) · Durum: {statusLabel}
      </p>

      {hasCost && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-slate-500">Gerçekleşen Bütçe onayı:</span>
          <ApprovalControl
            approved={entry.approved}
            canApprove={approver}
            action={approver ? setPlanWeekEntryApproval.bind(null, id) : undefined}
          />
        </div>
      )}

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

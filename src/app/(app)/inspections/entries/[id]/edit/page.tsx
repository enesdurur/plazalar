import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { updateInspectionWeekEntryCost } from "../../../actions";
import { SubmitButton } from "@/components/submit-button";
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

      <form action={updateWithId} className="mt-6 max-w-md space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Maliyet</span>
          <div className="flex gap-2">
            <input
              name="cost"
              type="number"
              step="0.01"
              defaultValue={entry.cost?.toString() ?? ""}
              className="input"
            />
            <select name="costCurrency" defaultValue={entry.costCurrency} className="input w-24">
              <option value="TRY">TL</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Not</span>
          <textarea name="note" rows={3} defaultValue={entry.note ?? ""} className="input" />
        </label>

        <div className="flex gap-3 pt-2">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}

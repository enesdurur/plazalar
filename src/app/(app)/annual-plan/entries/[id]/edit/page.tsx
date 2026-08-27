import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { updatePlanEntryCost } from "../../../actions";
import { SubmitButton } from "@/components/submit-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bakım Maliyeti",
};

const MONTH_NAMES = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export default async function EditPlanEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plaza = await getSelectedPlaza();

  const entry = await prisma.maintenancePlanEntry.findFirst({
    where: { id, machine: { plazaId: plaza.id } },
    include: { machine: true },
  });

  if (!entry) notFound();

  const updateWithId = updatePlanEntryCost.bind(null, id);
  const statusLabel =
    entry.completed === true ? "Yapıldı" : entry.completed === false ? "Yapılmadı" : "Boş";

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Bakım Maliyeti</h1>
      <p className="mt-1 text-sm text-slate-500">
        {entry.machine.name} · {MONTH_NAMES[entry.month - 1]} {entry.year} · Durum: {statusLabel}
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
            <select
              name="costCurrency"
              defaultValue={entry.costCurrency}
              className="input w-24"
            >
              <option value="TRY">TL</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Not</span>
          <textarea
            name="note"
            rows={3}
            defaultValue={entry.note ?? ""}
            className="input"
          />
        </label>

        <div className="flex gap-3 pt-2">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}

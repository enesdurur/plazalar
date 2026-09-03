import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { updateMaintenancePlanEntry } from "../../../actions";
import { SubmitButton } from "@/components/submit-button";
import { MONTH_NAMES } from "@/lib/plan/weeks";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eski Bakım Kaydını Düzenle",
};

export default async function EditLegacyPlanEntryPage({
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

  const action = updateMaintenancePlanEntry.bind(null, id);

  return (
    <div>
      <Link href="/maintenance-costs" className="text-sm text-slate-500 hover:text-slate-700">
        ← Bakım Maliyetleri
      </Link>
      <h1 className="mt-1 text-xl font-semibold text-slate-900">Eski Bakım Kaydını Düzenle</h1>
      <p className="mt-1 text-sm text-slate-500">
        {entry.machine.name} · {MONTH_NAMES[entry.month - 1]} {entry.year}
      </p>

      <form action={action} className="mt-6 max-w-md space-y-4">
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
          <input name="note" defaultValue={entry.note ?? ""} className="input" />
        </label>
        <div className="pt-2">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}

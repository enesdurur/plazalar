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

export default async function MaintenanceCostsPage() {
  const plaza = await getSelectedPlaza();

  const records = await prisma.maintenanceRecord.findMany({
    where: { machine: { plazaId: plaza.id }, sparePartCost: { not: null } },
    include: { machine: true, sparePart: true },
    orderBy: { reportedAt: "desc" },
  });

  const totals = { TRY: 0, USD: 0, EUR: 0 };
  for (const r of records) {
    if (r.sparePartCost) {
      totals[r.sparePartCostCurrency] += Number(r.sparePartCost);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← Panel
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">Bakım Maliyetleri</h1>
          <p className="mt-1 text-sm text-slate-500">
            Toplam {records.length} maliyetli kayıt · {formatCostAmount(totals.TRY, "TRY")}
            {totals.USD > 0 && ` · ${formatCostAmount(totals.USD, "USD")}`}
            {totals.EUR > 0 && ` · ${formatCostAmount(totals.EUR, "EUR")}`}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <PrintButton />
          <ExportLink href="/api/export/maintenance-costs" />
        </div>
      </div>

      <div className="mt-6 max-h-[70vh] overflow-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Tarih</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Makine</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Açıklama</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Yedek Parça</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Tutar</th>
              <th className="px-4 py-3 print:hidden" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((r) => (
              <tr key={r.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-slate-100">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {r.reportedAt.toLocaleDateString("tr-TR")}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">{r.machine.name}</td>
                <td className="max-w-xs truncate px-4 py-3 text-slate-600" title={r.description}>
                  {r.description}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {r.sparePart?.name ?? r.sparePartOther ?? "-"}
                  {r.sparePartQty ? ` (${r.sparePartQty} adet)` : ""}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                  {formatCostAmount(Number(r.sparePartCost), r.sparePartCostCurrency)}
                </td>
                <td className="px-4 py-3 text-right print:hidden">
                  <Link
                    href={`/records/${r.id}/edit`}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Düzenle
                  </Link>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Henüz maliyetli bir bakım kaydı yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

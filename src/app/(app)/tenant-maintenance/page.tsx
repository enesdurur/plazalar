import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { deleteTenantMaintenance } from "./actions";
import { DeleteButton } from "@/components/delete-button";
import { StatusBadge } from "@/components/status-badge";
import { ExportLink } from "@/components/export-link";
import { PrintButton } from "@/components/print-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kiracı Bakımları",
};

export default async function TenantMaintenancePage() {
  const session = await auth();
  const writable = canWrite(session?.user.role);
  const deletable = canDelete(session?.user.role);
  const plaza = await getSelectedPlaza();

  const items = await prisma.tenantMaintenance.findMany({
    where: { tenant: { plazaId: plaza.id } },
    include: { tenant: true },
    orderBy: { nextMaintenanceDate: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Kiracı Bakımları</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kiracıların ofis içi bakım takibi (fan-coil, elektrik, yangın vb.). Toplam{" "}
            {items.length} kayıt.
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <PrintButton />
          <ExportLink href="/api/export/tenant-maintenance" />
          {writable && (
            <Link
              href="/tenant-maintenance/new"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              + Yeni Kayıt
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 max-h-[70vh] overflow-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Kat</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Kiracı</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Bakım Türü</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Periyot</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Son Bakım</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Sonraki Bakım</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Durum</th>
              <th className="px-4 py-3 print:hidden" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((i) => (
              <tr key={i.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-slate-100">
                <td className="px-4 py-3 text-slate-600">{i.tenant.floor}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{i.tenant.companyName}</td>
                <td className="px-4 py-3 text-slate-600">{i.maintenanceType}</td>
                <td className="px-4 py-3 text-slate-600">{i.period ?? "-"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {i.lastMaintenanceDate ? i.lastMaintenanceDate.toLocaleDateString("tr-TR") : "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {i.nextMaintenanceDate
                    ? i.nextMaintenanceDate.toLocaleDateString("tr-TR")
                    : "-"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge nextDate={i.nextMaintenanceDate} />
                </td>
                <td className="px-4 py-3 text-right print:hidden">
                  <div className="flex justify-end gap-3">
                    {writable && (
                      <Link
                        href={`/tenant-maintenance/${i.id}/edit`}
                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                      >
                        Düzenle
                      </Link>
                    )}
                    {deletable && (
                      <DeleteButton action={deleteTenantMaintenance.bind(null, i.id)} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  Henüz kayıt yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

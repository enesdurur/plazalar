import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { ExportLink } from "@/components/export-link";
import { PrintButton } from "@/components/print-button";
import { TenantMaintenanceTable } from "./tenant-maintenance-table";
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

      <div className="mt-6">
        <TenantMaintenanceTable items={items} writable={writable} deletable={deletable} />
      </div>
    </div>
  );
}

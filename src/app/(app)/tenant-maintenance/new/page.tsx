import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { TenantMaintenanceForm } from "../tenant-maintenance-form";
import { createTenantMaintenance } from "../actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yeni Kiracı Bakım Kaydı",
};

export default async function NewTenantMaintenancePage() {
  const plaza = await getSelectedPlaza();
  const tenants = await prisma.tenant.findMany({
    where: { plazaId: plaza.id },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Yeni Kiracı Bakım Kaydı</h1>
      <div className="mt-6">
        <TenantMaintenanceForm action={createTenantMaintenance} tenants={tenants} />
      </div>
    </div>
  );
}

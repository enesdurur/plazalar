import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { TenantMaintenanceForm } from "../../tenant-maintenance-form";
import { updateTenantMaintenance } from "../../actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kiracı Bakım Kaydını Düzenle",
};

export default async function EditTenantMaintenancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plaza = await getSelectedPlaza();

  const [item, tenants] = await Promise.all([
    prisma.tenantMaintenance.findFirst({ where: { id, tenant: { plazaId: plaza.id } } }),
    prisma.tenant.findMany({ where: { plazaId: plaza.id }, orderBy: { sortOrder: "asc" } }),
  ]);

  if (!item) notFound();

  const updateWithId = updateTenantMaintenance.bind(null, id);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Kiracı Bakım Kaydını Düzenle</h1>
      <div className="mt-6">
        <TenantMaintenanceForm action={updateWithId} tenants={tenants} item={item} />
      </div>
    </div>
  );
}

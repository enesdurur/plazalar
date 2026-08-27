import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { TenantForm } from "../../tenant-form";
import { updateTenant } from "../../actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kiracı Düzenle",
};

export default async function EditTenantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plaza = await getSelectedPlaza();
  const tenant = await prisma.tenant.findFirst({ where: { id, plazaId: plaza.id } });

  if (!tenant) notFound();

  const updateWithId = updateTenant.bind(null, id);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Kiracı Düzenle</h1>
      <div className="mt-6">
        <TenantForm action={updateWithId} tenant={tenant} />
      </div>
    </div>
  );
}

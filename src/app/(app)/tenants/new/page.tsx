import { TenantForm } from "../tenant-form";
import { createTenant } from "../actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yeni Kiracı",
};

export default async function NewTenantPage({
  searchParams,
}: {
  searchParams: Promise<{ sortOrder?: string }>;
}) {
  const params = await searchParams;
  const nextSortOrder = params.sortOrder ? parseInt(params.sortOrder, 10) : 0;

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Yeni Kiracı Ekle</h1>
      <div className="mt-6">
        <TenantForm action={createTenant} nextSortOrder={nextSortOrder} />
      </div>
    </div>
  );
}

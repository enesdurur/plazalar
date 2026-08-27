import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { deleteTenant } from "./actions";
import { DeleteButton } from "@/components/delete-button";
import { ExportLink } from "@/components/export-link";
import { PrintButton } from "@/components/print-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kiracılar",
};

export default async function TenantsPage() {
  const session = await auth();
  const writable = canWrite(session?.user.role);
  const deletable = canDelete(session?.user.role);
  const plaza = await getSelectedPlaza();

  const tenants = await prisma.tenant.findMany({
    where: { plazaId: plaza.id },
    include: { _count: { select: { maintenances: true } } },
    orderBy: { sortOrder: "asc" },
  });

  const nextSortOrder = tenants.length
    ? Math.max(...tenants.map((t) => t.sortOrder)) + 1
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Kiracılar</h1>
          <p className="mt-1 text-sm text-slate-500">Toplam {tenants.length} kiracı kaydı.</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <PrintButton />
          <ExportLink href="/api/export/tenants" />
          {writable && (
            <Link
              href={`/tenants/new?sortOrder=${nextSortOrder}`}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              + Yeni Kiracı
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
              <th className="px-4 py-3 text-left font-medium text-slate-600">Bakım Kaydı</th>
              <th className="px-4 py-3 print:hidden" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tenants.map((t) => (
              <tr key={t.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{t.floor}</td>
                <td className="px-4 py-3 text-slate-600">{t.companyName}</td>
                <td className="px-4 py-3 text-slate-600">{t._count.maintenances}</td>
                <td className="px-4 py-3 text-right print:hidden">
                  <div className="flex justify-end gap-3">
                    {writable && (
                      <Link
                        href={`/tenants/${t.id}/edit`}
                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                      >
                        Düzenle
                      </Link>
                    )}
                    {deletable && <DeleteButton action={deleteTenant.bind(null, t.id)} />}
                  </div>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Henüz kiracı kaydı yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

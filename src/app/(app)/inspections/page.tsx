import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { ExportLink } from "@/components/export-link";
import { PrintButton } from "@/components/print-button";
import { InspectionsTable } from "./inspections-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Periyodik Muayene",
};

export default async function InspectionsPage() {
  const session = await auth();
  const writable = canWrite(session?.user.role);
  const deletable = canDelete(session?.user.role);
  const plaza = await getSelectedPlaza();

  const items = await prisma.periodicInspection.findMany({
    where: { plazaId: plaza.id },
    orderBy: { nextInspectionDate: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Periyodik Muayene Planı</h1>
          <p className="mt-1 text-sm text-slate-500">Toplam {items.length} kayıt.</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <PrintButton />
          <ExportLink href="/api/export/inspections" />
          {writable && (
            <Link
              href="/inspections/new"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              + Yeni Kayıt
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6">
        <InspectionsTable items={items} writable={writable} deletable={deletable} />
      </div>
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { ExportLink } from "@/components/export-link";
import { PrintButton } from "@/components/print-button";
import { MachinesTable } from "./machines-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Makine / Teçhizat",
};

export default async function MachinesPage() {
  const session = await auth();
  const writable = canWrite(session?.user.role);
  const deletable = canDelete(session?.user.role);
  const plaza = await getSelectedPlaza();

  const machines = await prisma.machine.findMany({
    where: { plazaId: plaza.id },
    include: { _count: { select: { records: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Makine / Teçhizat Listesi
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Toplam {machines.length} makine kayıtlı.
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <PrintButton />
          <ExportLink href="/api/export/machines" />
          {writable && (
            <Link
              href="/machines/new"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              + Yeni Makine
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6">
        <MachinesTable machines={machines} writable={writable} deletable={deletable} />
      </div>
    </div>
  );
}

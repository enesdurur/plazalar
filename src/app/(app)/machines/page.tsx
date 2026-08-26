import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { deleteMachine } from "./actions";
import { DeleteButton } from "@/components/delete-button";
import { ExportLink } from "@/components/export-link";
import { PrintButton } from "@/components/print-button";
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
    include: { line: true, _count: { select: { records: true } } },
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

      <div className="mt-6 max-h-[70vh] overflow-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Makine Adı</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Kod</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Hat</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Marka / Model</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Bölüm</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Kayıt Sayısı</th>
              <th className="px-4 py-3 print:hidden" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {machines.map((m) => (
              <tr key={m.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{m.name}</td>
                <td className="px-4 py-3 text-slate-600">{m.code ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600">{m.line?.name ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {[m.brand, m.model].filter(Boolean).join(" / ") || "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">{m.location ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600">{m._count.records}</td>
                <td className="px-4 py-3 text-right print:hidden">
                  <div className="flex justify-end gap-3">
                    {writable && (
                      <Link
                        href={`/machines/${m.id}/edit`}
                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                      >
                        Düzenle
                      </Link>
                    )}
                    {deletable && (
                      <DeleteButton action={deleteMachine.bind(null, m.id)} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {machines.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Henüz makine kaydı yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

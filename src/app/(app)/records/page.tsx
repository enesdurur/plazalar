import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { deleteRecord } from "./actions";
import { DeleteButton } from "@/components/delete-button";
import { ExportLink } from "@/components/export-link";
import { PrintButton } from "@/components/print-button";
import { mtta, mttr, formatMinutes } from "@/lib/kpi";
import type { Machine, IssueType, Technician, MaintenanceRecord } from "@prisma/client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arıza / Bakım Kayıtları",
};

const OPERATION_LABELS: Record<string, string> = {
  ARIZA: "Arıza",
  BAKIM: "Bakım",
};

type RecordWithRelations = MaintenanceRecord & {
  machine: Machine;
  issueType: IssueType | null;
  technician: Technician | null;
};

export default async function RecordsPage() {
  const session = await auth();
  const writable = canWrite(session?.user.role);
  const deletable = canDelete(session?.user.role);
  const plaza = await getSelectedPlaza();

  const records = await prisma.maintenanceRecord.findMany({
    where: { machine: { plazaId: plaza.id } },
    include: { machine: true, issueType: true, technician: true },
    orderBy: { reportedAt: "desc" },
    take: 200,
  });

  const ongoing = records.filter((r) => !r.finishedAt);
  const completed = records.filter((r) => r.finishedAt);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Arıza / Bakım Kayıtları
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Son {records.length} kayıt gösteriliyor.
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <PrintButton />
          <ExportLink href="/api/export/records" />
          {writable && (
            <Link
              href="/records/new"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              + Yeni Kayıt
            </Link>
          )}
        </div>
      </div>

      <h2 className="mt-6 text-sm font-semibold text-slate-900">
        Devam Eden Kayıtlar ({ongoing.length})
      </h2>
      <RecordsTable
        records={ongoing}
        writable={writable}
        deletable={deletable}
        emptyMessage="Devam eden kayıt yok."
      />

      <h2 className="mt-8 text-sm font-semibold text-slate-900">
        Tamamlanan Kayıtlar ({completed.length})
      </h2>
      <RecordsTable
        records={completed}
        writable={writable}
        deletable={deletable}
        emptyMessage="Tamamlanan kayıt yok."
      />
    </div>
  );
}

function RecordsTable({
  records,
  writable,
  deletable,
  emptyMessage,
}: {
  records: RecordWithRelations[];
  writable: boolean;
  deletable: boolean;
  emptyMessage: string;
}) {
  return (
    <div className="mt-3 max-h-[50vh] overflow-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Bildirim Zamanı</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Makine</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Tür</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Kategori</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Açıklama</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Teknisyen</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">MTTA</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">MTTR</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Durum</th>
            <th className="px-4 py-3 print:hidden" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {records.map((r) => (
            <tr key={r.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-slate-100">
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {r.reportedAt.toLocaleString("tr-TR")}
              </td>
              <td className="px-4 py-3 font-medium text-slate-900">{r.machine.name}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.operationType === "ARIZA"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {OPERATION_LABELS[r.operationType]}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600">{r.issueType?.name ?? "-"}</td>
              <td className="max-w-xs truncate px-4 py-3 text-slate-600" title={r.description}>
                {r.description}
              </td>
              <td className="px-4 py-3 text-slate-600">{r.technician?.name ?? "-"}</td>
              <td className="px-4 py-3 text-slate-600">
                {formatMinutes(mtta(r.reportedAt, r.respondedAt))}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {formatMinutes(mttr(r.respondedAt, r.finishedAt))}
              </td>
              <td className="px-4 py-3">
                {r.finishedAt ? (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Tamamlandı
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Devam Ediyor
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right print:hidden">
                <div className="flex justify-end gap-3">
                  {writable && (
                    <Link
                      href={`/records/${r.id}/edit`}
                      className="text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                      Düzenle
                    </Link>
                  )}
                  {deletable && <DeleteButton action={deleteRecord.bind(null, r.id)} />}
                </div>
              </td>
            </tr>
          ))}
          {records.length === 0 && (
            <tr>
              <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

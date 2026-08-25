import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";
import { deleteMachine } from "./actions";
import { DeleteButton } from "@/components/delete-button";

export default async function MachinesPage() {
  const session = await auth();
  const writable = canWrite(session?.user.role);
  const deletable = canDelete(session?.user.role);

  const machines = await prisma.machine.findMany({
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
        {writable && (
          <Link
            href="/machines/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            + Yeni Makine
          </Link>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Makine Adı</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Kod</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Hat</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Marka / Model</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Bölüm</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Kayıt Sayısı</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {machines.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{m.name}</td>
                <td className="px-4 py-3 text-slate-600">{m.code ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600">{m.line?.name ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {[m.brand, m.model].filter(Boolean).join(" / ") || "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">{m.location ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600">{m._count.records}</td>
                <td className="px-4 py-3 text-right">
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

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";
import { deleteCalibration } from "./actions";
import { DeleteButton } from "@/components/delete-button";
import { StatusBadge } from "@/components/status-badge";

export default async function CalibrationsPage() {
  const session = await auth();
  const writable = canWrite(session?.user.role);
  const deletable = canDelete(session?.user.role);

  const items = await prisma.calibration.findMany({
    orderBy: { nextCalibrationDate: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Kalibrasyon Planı</h1>
          <p className="mt-1 text-sm text-slate-500">Toplam {items.length} ölçüm cihazı.</p>
        </div>
        {writable && (
          <Link
            href="/calibrations/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            + Yeni Kayıt
          </Link>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Kod</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Cihaz Adı</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Ölçüm Aralığı</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Bölüm</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Son Kalibrasyon</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Sonraki Kalibrasyon</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Durum</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((i) => (
              <tr key={i.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600">{i.code ?? "-"}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{i.deviceName}</td>
                <td className="px-4 py-3 text-slate-600">{i.measurementRange ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600">{i.location ?? "-"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {i.lastCalibrationDate
                    ? i.lastCalibrationDate.toLocaleDateString("tr-TR")
                    : "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {i.nextCalibrationDate
                    ? i.nextCalibrationDate.toLocaleDateString("tr-TR")
                    : "-"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge nextDate={i.nextCalibrationDate} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    {writable && (
                      <Link
                        href={`/calibrations/${i.id}/edit`}
                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                      >
                        Düzenle
                      </Link>
                    )}
                    {deletable && (
                      <DeleteButton action={deleteCalibration.bind(null, i.id)} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  Henüz kayıt yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";
import { deleteVerification } from "./actions";
import { DeleteButton } from "@/components/delete-button";
import { StatusBadge } from "@/components/status-badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Doğrulama Planı",
};

export default async function VerificationsPage() {
  const session = await auth();
  const writable = canWrite(session?.user.role);
  const deletable = canDelete(session?.user.role);

  const items = await prisma.verification.findMany({
    orderBy: { nextVerificationDate: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Doğrulama Planı</h1>
          <p className="mt-1 text-sm text-slate-500">Toplam {items.length} kayıt.</p>
        </div>
        {writable && (
          <Link
            href="/verifications/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            + Yeni Kayıt
          </Link>
        )}
      </div>

      <div className="mt-6 max-h-[70vh] overflow-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Cihaz Adı</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Seri No</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Kullanım Yeri</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Periyot</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Doğrulama Tarihi</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Gelecek Doğrulama</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Durum</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((i) => (
              <tr key={i.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{i.deviceName}</td>
                <td className="px-4 py-3 text-slate-600">{i.deviceSerialNo ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600">{i.usageLocation ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600">{i.verificationPeriod ?? "-"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {i.verificationDate ? i.verificationDate.toLocaleDateString("tr-TR") : "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {i.nextVerificationDate
                    ? i.nextVerificationDate.toLocaleDateString("tr-TR")
                    : "-"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge nextDate={i.nextVerificationDate} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    {writable && (
                      <Link
                        href={`/verifications/${i.id}/edit`}
                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                      >
                        Düzenle
                      </Link>
                    )}
                    {deletable && (
                      <DeleteButton action={deleteVerification.bind(null, i.id)} />
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

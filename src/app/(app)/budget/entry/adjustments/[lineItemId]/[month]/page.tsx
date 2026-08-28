import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { allowsAdjustments, isLockedMonth } from "@/lib/budget/calc";
import { addAdjustment, deleteAdjustment } from "../../../../actions";
import { DeleteButton } from "@/components/delete-button";
import { SubmitButton } from "@/components/submit-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fazla Mesai / Eksik Çalışma",
};

const MONTH_NAMES = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

const TYPE_LABELS: Record<string, string> = {
  OVERTIME: "Fazla Mesai",
  ABSENCE: "Eksik Çalışma",
};

export default async function AdjustmentsPage({
  params,
}: {
  params: Promise<{ lineItemId: string; month: string }>;
}) {
  const session = await auth();
  if (!session?.user || !canWrite(session.user.role)) {
    redirect("/budget");
  }

  const { lineItemId, month: monthParam } = await params;
  const month = parseInt(monthParam, 10);
  const plaza = await getSelectedPlaza();

  const item = await prisma.budgetLineItem.findFirst({
    where: { id: lineItemId, section: { plazaId: plaza.id } },
    include: {
      section: true,
      adjustments: { where: { month }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!item) notFound();

  const locked = isLockedMonth(item.section.year, month);
  const allowed = allowsAdjustments(item.category);
  const addAction = addAdjustment.bind(null, lineItemId, month);

  return (
    <div>
      <Link
        href={`/budget/entry?year=${item.section.year}`}
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        ← Veri Girişi
      </Link>
      <h1 className="mt-1 text-xl font-semibold text-slate-900">
        {item.label} — {MONTH_NAMES[month - 1]} {item.section.year}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Fazla mesai kalemin tutarına eklenir, eksik çalışma düşülür.
      </p>

      <div className="mt-6 max-w-lg overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Tür</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Not</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Tutar</th>
              <th className="px-4 py-3 print:hidden" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {item.adjustments.map((a) => (
              <tr key={a.id} className="odd:bg-white even:bg-slate-50/60">
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      a.type === "OVERTIME"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {TYPE_LABELS[a.type]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{a.label ?? "-"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-900">
                  {a.type === "OVERTIME" ? "+" : "-"}
                  {Number(a.amount).toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  TL
                </td>
                <td className="px-4 py-3 text-right print:hidden">
                  {!locked && <DeleteButton action={deleteAdjustment.bind(null, a.id)} />}
                </td>
              </tr>
            ))}
            {item.adjustments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  Bu ay için henüz kırılım yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {locked ? (
        <p className="mt-4 text-sm text-slate-500">
          Bu ay için veri kilitli, yeni kırılım eklenemez.
        </p>
      ) : !allowed ? (
        <p className="mt-4 text-sm text-slate-500">
          Bu kalem için fazla mesai/eksik çalışma kırılımı kullanılamıyor. Bu özellik yalnızca
          Güvenlik, Teknik, Temizlik ve Bahçıvan kadrolarında geçerlidir.
        </p>
      ) : (
        <form action={addAction} className="mt-6 max-w-lg space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Yeni Kırılım Ekle</h2>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Tür *</span>
            <select name="type" required defaultValue="OVERTIME" className="input">
              <option value="OVERTIME">Fazla Mesai</option>
              <option value="ABSENCE">Eksik Çalışma</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Tutar (TL) *</span>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              className="input"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Not (opsiyonel, örn. kişi adı)
            </span>
            <input name="label" className="input" />
          </label>
          <SubmitButton>Ekle</SubmitButton>
        </form>
      )}
    </div>
  );
}

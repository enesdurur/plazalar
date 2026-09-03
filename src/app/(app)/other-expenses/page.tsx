import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete, canApprove } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { SECTION_NAMES } from "@/lib/budget/calc";
import { toAttachmentInfo } from "@/lib/attachments/service";
import { OtherExpensesTable } from "./other-expenses-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diğer Giderler",
};

export default async function OtherExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const year = params.year ? parseInt(params.year, 10) : new Date().getFullYear();

  const session = await auth();
  const writable = canWrite(session?.user.role);
  const deletable = canDelete(session?.user.role);
  const approver = canApprove(session?.user.role);
  const plaza = await getSelectedPlaza();

  const section = await prisma.budgetSection.findFirst({
    where: { plazaId: plaza.id, year, name: SECTION_NAMES.other },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  const lineItems = section?.items ?? [];

  const entries = lineItems.length
    ? await prisma.otherExpenseEntry.findMany({
        where: { lineItemId: { in: lineItems.map((i) => i.id) } },
        include: {
          lineItem: true,
          createdBy: true,
          approvedBy: true,
          attachments: { include: { uploadedBy: true } },
        },
        orderBy: [{ month: "desc" }, { createdAt: "desc" }],
      })
    : [];

  const serialized = entries.map((e) => ({
    id: e.id,
    lineItemId: e.lineItemId,
    lineItemLabel: e.lineItem.label,
    month: e.month,
    amount: Number(e.amount),
    note: e.note,
    approved: e.approved,
    approvedByName: e.approvedBy?.name ?? null,
    createdByName: e.createdBy?.name ?? null,
    attachment: toAttachmentInfo(e.attachments.find((a) => a.kind === "INVOICE")),
  }));

  const lineItemOptions = lineItems.map((i) => ({
    id: i.id,
    label: i.label,
    monthlyBudget: Number(i.monthlyBudget),
  }));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Diğer Giderler</h1>
          <p className="mt-1 text-sm text-slate-500">
            {year} yılı Diğer Giderler kalemlerinin (Ortak Alan Elektrik, Mekanik/Elektrik Yedek
            Parça, 3.Firma Bakım Anlaşmaları, Fenni Muayeneler vb.) tüm veri girişi buradan
            yapılır: her kayıt tutarı ve destekleyici belgesiyle girilir, bina yöneticisi
            onayından sonra Gerçekleşen Bütçe&apos;ye yansır.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/other-expenses?year=${year - 1}`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            ← {year - 1}
          </Link>
          <span className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white">
            {year}
          </span>
          <Link
            href={`/other-expenses?year=${year + 1}`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            {year + 1} →
          </Link>
          {writable && lineItems.length > 0 && (
            <Link
              href={`/other-expenses/new?year=${year}`}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              + Yeni Kayıt
            </Link>
          )}
        </div>
      </div>

      {lineItems.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">
            {year} yılı için henüz Diğer Giderler kalemi tanımlanmadı.
          </p>
          <Link
            href={`/budget/setup?year=${year}`}
            className="mt-3 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Kalemleri Tanımla
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Kalem</th>
                  <th className="px-4 py-2 text-right font-medium text-slate-600">
                    Aylık Taslak Bütçe
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lineItemOptions.map((i) => (
                  <tr key={i.id} className="odd:bg-white even:bg-slate-50/60">
                    <td className="px-4 py-2 font-medium text-slate-900">{i.label}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-slate-600">
                      {i.monthlyBudget.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      TL
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <OtherExpensesTable
              entries={serialized}
              writable={writable}
              deletable={deletable}
              approver={approver}
            />
          </div>
        </>
      )}
    </div>
  );
}

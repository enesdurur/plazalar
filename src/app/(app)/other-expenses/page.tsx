import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete, canApprove, canAddInvoice, canAddMaintenanceForm } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { SECTION_NAMES } from "@/lib/budget/calc";
import { toAttachmentInfo } from "@/lib/attachments/service";
import { OtherExpensesTable } from "./other-expenses-table";
import { CostsTable } from "../records/costs/costs-table";
import { PlanEntriesTable } from "../maintenance-costs/plan-entries-table";
import { InspectionsCostTable } from "../maintenance-costs/inspections-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diğer Giderler",
};

const MONTH_NAMES = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

const AUTO_SOURCE_LABELS: Record<string, string> = {
  MAINTENANCE_PLAN: "3. Firma Bakım Planı",
  INSPECTION: "Periyodik (Fenni) Muayene",
  FAULT_RECORDS: "Arıza Kayıtları",
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
  const canForm = canAddMaintenanceForm(session?.user.role);
  const canInvoice = canAddInvoice(session?.user.role);
  const plaza = await getSelectedPlaza();

  const section = await prisma.budgetSection.findFirst({
    where: { plazaId: plaza.id, year, name: SECTION_NAMES.other },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  const lineItems = section?.items ?? [];
  const manualItems = lineItems.filter((i) => !i.autoSource);
  const autoItems = lineItems.filter((i) => i.autoSource);

  const monthEntries = lineItems.length
    ? await prisma.budgetMonthEntry.findMany({
        where: { lineItemId: { in: lineItems.map((i) => i.id) } },
        select: { lineItemId: true, month: true, manualAmount: true },
      })
    : [];
  const monthEntryMap = new Map(
    monthEntries.map((e) => [`${e.lineItemId}-${e.month}`, e.manualAmount != null ? Number(e.manualAmount) : null])
  );

  const otherExpenses = manualItems.length
    ? await prisma.otherExpenseEntry.findMany({
        where: { lineItemId: { in: manualItems.map((i) => i.id) } },
        include: {
          lineItem: true,
          createdBy: true,
          approvedBy: true,
          attachments: { include: { uploadedBy: true } },
        },
        orderBy: [{ month: "desc" }, { createdAt: "desc" }],
      })
    : [];

  const serializedManualEntries = otherExpenses.map((e) => ({
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

  // Otomatik kaynaklı kalemler (varsa): ilgili modülün gerçek verisi + onay/belge yönetimi
  // burada da yapılabilsin diye o modülün kendi (zaten çalışan) tablo bileşenini,
  // sadece bu yıla filtrelenmiş veriyle gömüyoruz.
  const wantsFaultRecords = autoItems.some((i) => i.autoSource === "FAULT_RECORDS");
  const wantsMaintenancePlan = autoItems.some((i) => i.autoSource === "MAINTENANCE_PLAN");
  const wantsInspection = autoItems.some((i) => i.autoSource === "INSPECTION");

  const [faultRecords, planEntries, inspectionEntries] = await Promise.all([
    wantsFaultRecords
      ? prisma.maintenanceRecord.findMany({
          where: {
            machine: { plazaId: plaza.id },
            operationType: "ARIZA",
            sparePartCost: { not: null },
            reportedAt: {
              gte: new Date(Date.UTC(year, 0, 1)),
              lt: new Date(Date.UTC(year + 1, 0, 1)),
            },
          },
          include: { machine: true, sparePart: true, attachments: { include: { uploadedBy: true } } },
          orderBy: { reportedAt: "desc" },
        })
      : Promise.resolve([]),
    wantsMaintenancePlan
      ? prisma.maintenancePlanWeekEntry.findMany({
          where: {
            year,
            item: { plazaId: plaza.id },
            OR: [{ cost: { not: null } }, { sparePartCost: { not: null } }],
          },
          include: { item: true, attachments: { include: { uploadedBy: true } } },
          orderBy: { week: "desc" },
        })
      : Promise.resolve([]),
    wantsInspection
      ? prisma.inspectionPlanWeekEntry.findMany({
          where: {
            year,
            item: { plazaId: plaza.id },
            OR: [{ cost: { not: null } }, { sparePartCost: { not: null } }],
          },
          include: { item: true, attachments: { include: { uploadedBy: true } } },
          orderBy: { week: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const faultRecordsSerialized = faultRecords.map((r) => ({
    ...r,
    sparePartCost: r.sparePartCost != null ? Number(r.sparePartCost) : null,
    sparePartExchangeRate: r.sparePartExchangeRate != null ? Number(r.sparePartExchangeRate) : null,
    formAttachment: toAttachmentInfo(r.attachments.find((a) => a.kind === "MAINTENANCE_FORM")),
    invoiceAttachment: toAttachmentInfo(r.attachments.find((a) => a.kind === "INVOICE")),
  }));
  const planEntriesSerialized = planEntries.map((e) => ({
    ...e,
    cost: e.cost != null ? Number(e.cost) : null,
    sparePartCost: e.sparePartCost != null ? Number(e.sparePartCost) : null,
    formAttachment: toAttachmentInfo(e.attachments.find((a) => a.kind === "MAINTENANCE_FORM")),
    invoiceAttachment: toAttachmentInfo(e.attachments.find((a) => a.kind === "INVOICE")),
  }));
  const inspectionEntriesSerialized = inspectionEntries.map((e) => ({
    ...e,
    cost: e.cost != null ? Number(e.cost) : null,
    sparePartCost: e.sparePartCost != null ? Number(e.sparePartCost) : null,
    formAttachment: toAttachmentInfo(e.attachments.find((a) => a.kind === "MAINTENANCE_FORM")),
    invoiceAttachment: toAttachmentInfo(e.attachments.find((a) => a.kind === "INVOICE")),
  }));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Diğer Giderler</h1>
          <p className="mt-1 text-sm text-slate-500">
            {year} yılı Diğer Giderler kalemlerinin bütçe ve evrak yönetimi buradan yapılır.
            Ortak Alan Elektrik gibi kalemler için kayıt tutarı + belgesi doğrudan burada
            girilir; Mekanik/Elektrik Yedek Parça, 3.Firma Bakım Anlaşmaları, Fenni Muayeneler
            gibi kalemler ilgili modülden (Arıza Kayıtları / 3. Firma Bakım Planı / Periyodik
            Muayene) otomatik gelir — form/fatura yükleme ve bina yöneticisi onayı aşağıda da
            yapılabilir. Onaylanmayan hiçbir tutar Gerçekleşen Bütçe&apos;ye yansımaz.
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
          {writable && manualItems.length > 0 && (
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
          <h2 className="mt-6 text-sm font-semibold text-slate-900">
            Aylık Özet — Ay Ay Girilen Tutarlar
          </h2>
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="sticky left-0 z-10 bg-slate-50 px-4 py-2 text-left font-medium text-slate-600">
                    Kalem
                  </th>
                  {MONTH_NAMES.map((m) => (
                    <th key={m} className="px-2 py-2 text-right font-medium text-slate-600">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lineItems.map((item) => (
                  <tr key={item.id} className="odd:bg-white even:bg-slate-50/60">
                    <td className="sticky left-0 z-10 bg-white px-4 py-2">
                      <p className="font-medium text-slate-900">{item.label}</p>
                      {item.autoSource && (
                        <p className="text-xs text-slate-400">
                          Otomatik: {AUTO_SOURCE_LABELS[item.autoSource]}
                        </p>
                      )}
                    </td>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                      const amount = monthEntryMap.get(`${item.id}-${month}`) ?? null;
                      return (
                        <td
                          key={month}
                          className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-slate-600"
                        >
                          {amount != null
                            ? amount.toLocaleString("tr-TR", { maximumFractionDigits: 0 })
                            : "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {manualItems.length > 0 && (
            <>
              <h2 className="mt-8 text-sm font-semibold text-slate-900">Elle Girilen Kayıtlar</h2>
              <div className="mt-3">
                <OtherExpensesTable
                  entries={serializedManualEntries}
                  writable={writable}
                  deletable={deletable}
                  approver={approver}
                />
              </div>
            </>
          )}

          {autoItems.length > 0 && (
            <div className="mt-10">
              <h2 className="text-sm font-semibold text-slate-900">Otomatik Gelen Kayıtlar</h2>
              <p className="mt-1 text-sm text-slate-500">
                Bu kalemlerin tutarı ilgili modülden otomatik gelir — onay ve belge yönetimini
                isterseniz doğrudan burada yapabilirsiniz.
              </p>

              {wantsFaultRecords && (
                <>
                  <h3 className="mt-6 text-sm font-medium text-slate-700">
                    Arıza Kayıtları (yedek parça)
                  </h3>
                  <div className="mt-2">
                    <CostsTable
                      records={faultRecordsSerialized}
                      approver={approver}
                      canForm={canForm}
                      canInvoice={canInvoice}
                    />
                  </div>
                </>
              )}

              {wantsMaintenancePlan && (
                <>
                  <h3 className="mt-6 text-sm font-medium text-slate-700">3. Firma Bakım Planı</h3>
                  <div className="mt-2">
                    <PlanEntriesTable
                      entries={planEntriesSerialized}
                      approver={approver}
                      canForm={canForm}
                      canInvoice={canInvoice}
                    />
                  </div>
                </>
              )}

              {wantsInspection && (
                <>
                  <h3 className="mt-6 text-sm font-medium text-slate-700">
                    Periyodik (Fenni) Muayene
                  </h3>
                  <div className="mt-2">
                    <InspectionsCostTable
                      entries={inspectionEntriesSerialized}
                      approver={approver}
                      canForm={canForm}
                      canInvoice={canInvoice}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete, canApprove, canAddInvoice, canAddMaintenanceForm } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { SECTION_NAMES, isLockedMonth } from "@/lib/budget/calc";
import { toTRY } from "@/lib/budget/auto-sync";
import { monthOfWeek } from "@/lib/plan/weeks";
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

// Gerçekleşen Bütçe'nin kendi tablosuyla (budget-view.tsx'teki formatTL) aynı biçim — kuruşlar dahil.
function formatTL(amount: number) {
  return `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
}

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
    invoiceAttachment: toAttachmentInfo(e.attachments.find((a) => a.kind === "INVOICE")),
    formAttachment: toAttachmentInfo(e.attachments.find((a) => a.kind === "MAINTENANCE_FORM")),
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

  // "Aylık Özet" tablosu, onay durumundan bağımsız olarak GİRİLEN tüm tutarları gösterir
  // (bina yöneticisi onayı yalnızca Gerçekleşen Bütçe'ye yansımayı belirler — bkz. üstteki not).
  const enteredMonthMap = new Map<string, number>();
  function addEntered(lineItemId: string, month: number, amount: number) {
    const key = `${lineItemId}-${month}`;
    enteredMonthMap.set(key, (enteredMonthMap.get(key) ?? 0) + amount);
  }

  // Ocak-Haziran 2026 "kilitli" aylar — bu aylarda hiçbir modülden canlı kayıt akmaz (Excel'den
  // içe aktarılan tarihsel veri dondurulmuştur), o yüzden bu ayların tek kaynağı doğrudan
  // Gerçekleşen Bütçe'deki (BudgetMonthEntry) zaten girilmiş rakamlardır.
  const lockedMonths = Array.from({ length: 6 }, (_, i) => i + 1).filter((m) =>
    isLockedMonth(year, m)
  );
  if (lockedMonths.length > 0 && lineItems.length > 0) {
    const lockedEntries = await prisma.budgetMonthEntry.findMany({
      where: { lineItemId: { in: lineItems.map((i) => i.id) }, month: { in: lockedMonths } },
      select: { lineItemId: true, month: true, manualAmount: true },
    });
    for (const e of lockedEntries) {
      if (e.manualAmount != null) {
        enteredMonthMap.set(`${e.lineItemId}-${e.month}`, Number(e.manualAmount));
      }
    }
  }

  for (const e of otherExpenses) {
    addEntered(e.lineItemId, e.month, Number(e.amount));
  }

  const faultLineItem = autoItems.find((i) => i.autoSource === "FAULT_RECORDS");
  if (faultLineItem) {
    for (const r of faultRecords) {
      if (r.sparePartCost == null) continue;
      const tl = toTRY(
        Number(r.sparePartCost),
        r.sparePartCostCurrency,
        r.sparePartExchangeRate != null ? Number(r.sparePartExchangeRate) : null
      );
      if (tl != null) addEntered(faultLineItem.id, r.reportedAt.getUTCMonth() + 1, tl);
    }
  }

  const planLineItem = autoItems.find((i) => i.autoSource === "MAINTENANCE_PLAN");
  if (planLineItem) {
    for (const e of planEntries) {
      const month = monthOfWeek(e.week);
      if (e.cost != null) {
        const tl = toTRY(Number(e.cost), e.costCurrency, e.costExchangeRate != null ? Number(e.costExchangeRate) : null);
        if (tl != null) addEntered(planLineItem.id, month, tl);
      }
      if (e.sparePartCost != null) {
        const tl = toTRY(
          Number(e.sparePartCost),
          e.sparePartCostCurrency,
          e.sparePartExchangeRate != null ? Number(e.sparePartExchangeRate) : null
        );
        if (tl != null) addEntered(planLineItem.id, month, tl);
      }
    }
  }

  const inspectionLineItem = autoItems.find((i) => i.autoSource === "INSPECTION");
  if (inspectionLineItem) {
    for (const e of inspectionEntries) {
      const month = monthOfWeek(e.week);
      if (e.cost != null) {
        const tl = toTRY(Number(e.cost), e.costCurrency, e.costExchangeRate != null ? Number(e.costExchangeRate) : null);
        if (tl != null) addEntered(inspectionLineItem.id, month, tl);
      }
      if (e.sparePartCost != null) {
        const tl = toTRY(
          Number(e.sparePartCost),
          e.sparePartCostCurrency,
          e.sparePartExchangeRate != null ? Number(e.sparePartExchangeRate) : null
        );
        if (tl != null) addEntered(inspectionLineItem.id, month, tl);
      }
    }
  }

  const monthTotals = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return lineItems.reduce((sum, item) => sum + (enteredMonthMap.get(`${item.id}-${month}`) ?? 0), 0);
  });
  const grandTotal = monthTotals.reduce((a, b) => a + b, 0);

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
          <p className="mt-1 text-sm text-slate-500">
            Kayıt girilir girilmez (onaydan bağımsız) burada görünür. Gerçekleşen Bütçe&apos;ye
            yalnızca bina yöneticisinin onayladığı tutarlar yansır.
          </p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full table-fixed divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="sticky left-0 z-10 w-[240px] bg-slate-50 px-4 py-2 text-left font-medium text-slate-600">
                    Kalem
                  </th>
                  {MONTH_NAMES.map((m) => (
                    <th key={m} className="px-2 py-2 text-right font-medium text-slate-600">
                      {m}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right font-semibold text-slate-700">Toplam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lineItems.map((item) => {
                  const itemTotal = Array.from({ length: 12 }, (_, i) => i + 1).reduce(
                    (sum, month) => sum + (enteredMonthMap.get(`${item.id}-${month}`) ?? 0),
                    0
                  );
                  return (
                    <tr key={item.id} className="odd:bg-white even:bg-slate-50/60">
                      <td className="sticky left-0 z-10 w-[240px] overflow-hidden bg-inherit px-4 py-2 align-top">
                        <p className="truncate font-medium text-slate-900" title={item.label}>
                          {item.label}
                        </p>
                        {item.autoSource && (
                          <p
                            className="truncate whitespace-nowrap text-[10px] text-slate-400"
                            title={`Otomatik: ${AUTO_SOURCE_LABELS[item.autoSource]}`}
                          >
                            Otomatik: {AUTO_SOURCE_LABELS[item.autoSource]}
                          </p>
                        )}
                      </td>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                        const amount = enteredMonthMap.get(`${item.id}-${month}`) ?? null;
                        return (
                          <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-slate-600" key={month}>
                            {amount != null ? formatTL(amount) : "-"}
                          </td>
                        );
                      })}
                      <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums text-slate-900">
                        {itemTotal > 0 ? formatTL(itemTotal) : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-100">
                  <td className="sticky left-0 z-10 bg-slate-100 px-4 py-2 font-semibold text-slate-900">
                    TOPLAM
                  </td>
                  {monthTotals.map((total, i) => (
                    <td
                      key={i}
                      className="whitespace-nowrap px-2 py-2 text-right font-semibold tabular-nums text-slate-900"
                    >
                      {total > 0 ? formatTL(total) : "-"}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums text-slate-900">
                    {formatTL(grandTotal)}
                  </td>
                </tr>
              </tfoot>
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
                  <h3 className="mt-6 text-sm font-medium text-slate-700">Arıza Kayıtları</h3>
                  <div className="mt-2">
                    <CostsTable
                      records={faultRecordsSerialized}
                      showApproval
                      deletable={deletable}
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
                      showApproval
                      deletable={deletable}
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
                      showApproval
                      deletable={deletable}
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

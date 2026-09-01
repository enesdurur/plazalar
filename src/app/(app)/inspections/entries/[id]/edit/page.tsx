import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canApprove, canAddInvoice, canAddMaintenanceForm } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import {
  updateInspectionWeekEntryCost,
  setInspectionWeekEntryApproval,
  uploadInspectionWeekEntryAttachment,
  deleteInspectionWeekEntryAttachment,
} from "../../../actions";
import { WeekEntryCostForm } from "@/components/week-entry-cost-form";
import { ApprovalControl } from "@/components/approval-control";
import { AttachmentUpload } from "@/components/attachment-upload";
import { monthOfWeek, MONTH_NAMES } from "@/lib/plan/weeks";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fenni Muayene Maliyeti",
};

export default async function EditInspectionWeekEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const approver = canApprove(session?.user.role);
  const canInvoice = canAddInvoice(session?.user.role);
  const canForm = canAddMaintenanceForm(session?.user.role);
  const plaza = await getSelectedPlaza();

  const entry = await prisma.inspectionPlanWeekEntry.findFirst({
    where: { id, item: { plazaId: plaza.id } },
    include: { item: true, attachments: { include: { uploadedBy: true } } },
  });

  if (!entry) notFound();

  const updateWithId = updateInspectionWeekEntryCost.bind(null, id);
  const statusLabel =
    entry.completed === true ? "Yapıldı" : entry.completed === false ? "Yapılmadı" : "Boş";
  const monthName = MONTH_NAMES[monthOfWeek(entry.week) - 1];
  const hasCost = entry.cost != null || entry.sparePartCost != null;
  const invoice = entry.attachments.find((a) => a.kind === "INVOICE");
  const form = entry.attachments.find((a) => a.kind === "MAINTENANCE_FORM");

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Fenni Muayene Maliyeti</h1>
      <p className="mt-1 text-sm text-slate-500">
        {entry.item.label} · {monthName} {entry.year} ({entry.week}. hafta) · Durum: {statusLabel}
      </p>

      {hasCost && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-slate-500">Gerçekleşen Bütçe onayı:</span>
          <ApprovalControl
            approved={entry.approved}
            canApprove={approver}
            action={approver ? setInspectionWeekEntryApproval.bind(null, id) : undefined}
          />
        </div>
      )}

      <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
        <AttachmentUpload
          label="Bakım Formu"
          kind="MAINTENANCE_FORM"
          attachment={
            form
              ? {
                  id: form.id,
                  fileName: form.fileName,
                  fileUrl: form.fileUrl,
                  uploadedAt: form.uploadedAt.toISOString(),
                  uploaderName: form.uploadedBy?.name ?? null,
                }
              : null
          }
          canManage={canForm}
          uploadAction={uploadInspectionWeekEntryAttachment.bind(null, id)}
          deleteAction={
            form ? deleteInspectionWeekEntryAttachment.bind(null, id, form.id) : undefined
          }
        />
        <AttachmentUpload
          label="Fatura"
          kind="INVOICE"
          attachment={
            invoice
              ? {
                  id: invoice.id,
                  fileName: invoice.fileName,
                  fileUrl: invoice.fileUrl,
                  uploadedAt: invoice.uploadedAt.toISOString(),
                  uploaderName: invoice.uploadedBy?.name ?? null,
                }
              : null
          }
          canManage={canInvoice}
          uploadAction={uploadInspectionWeekEntryAttachment.bind(null, id)}
          deleteAction={
            invoice ? deleteInspectionWeekEntryAttachment.bind(null, id, invoice.id) : undefined
          }
        />
      </div>

      <WeekEntryCostForm
        action={updateWithId}
        defaults={{
          cost: entry.cost?.toString(),
          costCurrency: entry.costCurrency,
          costExchangeRate: entry.costExchangeRate?.toString(),
          note: entry.note,
          sparePartCost: entry.sparePartCost?.toString(),
          sparePartCostCurrency: entry.sparePartCostCurrency,
          sparePartExchangeRate: entry.sparePartExchangeRate?.toString(),
          sparePartNote: entry.sparePartNote,
        }}
      />
    </div>
  );
}

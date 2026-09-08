import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canAddInvoice, canAddMaintenanceForm, canSetResponsibleCompany } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { RecordForm } from "../../record-form";
import { updateRecord, uploadRecordAttachment, deleteRecordAttachment } from "../../actions";
import { AttachmentUpload } from "@/components/attachment-upload";
import { WorkProcessSection } from "../../work-process-section";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kayıt Düzenle",
};

export default async function EditRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const canInvoice = canAddInvoice(session?.user.role);
  const canForm = canAddMaintenanceForm(session?.user.role);
  const canSetCompany = canSetResponsibleCompany(session?.user.role);
  const plaza = await getSelectedPlaza();
  const organizationId = session!.user.organizationId;

  const [record, machines, issueTypes, technicians] = await Promise.all([
    prisma.maintenanceRecord.findFirst({
      where: { id, plazaId: plaza.id },
      include: {
        attachments: { include: { uploadedBy: true } },
        quotes: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.machine.findMany({ where: { plazaId: plaza.id }, orderBy: { name: "asc" } }),
    prisma.issueType.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
    prisma.technician.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
  ]);

  if (!record) notFound();

  const updateWithId = updateRecord.bind(null, id);
  const invoice = record.attachments.find((a) => a.kind === "INVOICE");
  const form = record.attachments.find((a) => a.kind === "MAINTENANCE_FORM");

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Kayıt Düzenle</h1>

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
          uploadAction={uploadRecordAttachment.bind(null, id)}
          deleteAction={form ? deleteRecordAttachment.bind(null, id, form.id) : undefined}
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
          uploadAction={uploadRecordAttachment.bind(null, id)}
          deleteAction={invoice ? deleteRecordAttachment.bind(null, id, invoice.id) : undefined}
        />
      </div>

      <div className="mt-6">
        <RecordForm
          action={updateWithId}
          machines={machines}
          issueTypes={issueTypes}
          technicians={technicians}
          record={record}
          canSetCompany={canSetCompany}
        />
      </div>

      <div className="max-w-2xl">
        <WorkProcessSection
          recordId={id}
          issueTypes={issueTypes}
          quotes={record.quotes.map((q) => ({
            id: q.id,
            contractorName: q.contractorName,
            workItem: q.workItem,
            amount: Number(q.amount),
            currency: q.currency,
            note: q.note,
            selected: q.selected,
          }))}
        />
      </div>
    </div>
  );
}

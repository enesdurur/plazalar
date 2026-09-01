import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canAddInvoice, canAddMaintenanceForm } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { RecordForm } from "../../record-form";
import { updateRecord, uploadRecordAttachment, deleteRecordAttachment } from "../../actions";
import { AttachmentUpload } from "@/components/attachment-upload";
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
  const plaza = await getSelectedPlaza();

  const [record, machines, issueTypes, technicians, spareParts] = await Promise.all([
    prisma.maintenanceRecord.findFirst({
      where: { id, machine: { plazaId: plaza.id } },
      include: { attachments: { include: { uploadedBy: true } } },
    }),
    prisma.machine.findMany({ where: { plazaId: plaza.id }, orderBy: { name: "asc" } }),
    prisma.issueType.findMany({ orderBy: { name: "asc" } }),
    prisma.technician.findMany({ orderBy: { name: "asc" } }),
    prisma.sparePart.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
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
          spareParts={spareParts}
          record={record}
        />
      </div>
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete, canApprove, canAddInvoice, canAddMaintenanceForm } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { toAttachmentInfo } from "@/lib/attachments/service";
import { ExportLink } from "@/components/export-link";
import { PrintButton } from "@/components/print-button";
import { RecordsTable } from "./records-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arıza Kayıtları",
};

export default async function RecordsPage() {
  const session = await auth();
  const writable = canWrite(session?.user.role);
  const deletable = canDelete(session?.user.role);
  const approver = canApprove(session?.user.role);
  const canForm = canAddMaintenanceForm(session?.user.role);
  const canInvoice = canAddInvoice(session?.user.role);
  const plaza = await getSelectedPlaza();

  const records = await prisma.maintenanceRecord.findMany({
    where: { machine: { plazaId: plaza.id } },
    include: {
      machine: true,
      issueType: true,
      technician: true,
      attachments: { include: { uploadedBy: true } },
    },
    orderBy: { reportedAt: "desc" },
    take: 200,
  });

  // Prisma Decimal alanları Client Component'lere doğrudan aktarılamaz — düz sayıya çeviriyoruz.
  const serialized = records.map((r) => ({
    ...r,
    sparePartCost: r.sparePartCost != null ? Number(r.sparePartCost) : null,
    sparePartExchangeRate: r.sparePartExchangeRate != null ? Number(r.sparePartExchangeRate) : null,
    formAttachment: toAttachmentInfo(r.attachments.find((a) => a.kind === "MAINTENANCE_FORM")),
    invoiceAttachment: toAttachmentInfo(r.attachments.find((a) => a.kind === "INVOICE")),
  }));

  const ongoing = serialized.filter((r) => !r.finishedAt);
  const completed = serialized.filter((r) => r.finishedAt);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Arıza Kayıtları
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Son {records.length} kayıt gösteriliyor.
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <PrintButton />
          <ExportLink href="/api/export/records" />
          {writable && (
            <Link
              href="/records/new"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              + Yeni Kayıt
            </Link>
          )}
        </div>
      </div>

      <h2 className="mt-6 text-sm font-semibold text-slate-900">
        Devam Eden Kayıtlar ({ongoing.length})
      </h2>
      <div className="mt-3">
        <RecordsTable
          records={ongoing}
          writable={writable}
          deletable={deletable}
          approver={approver}
          canForm={canForm}
          canInvoice={canInvoice}
          emptyMessage="Devam eden kayıt yok."
        />
      </div>

      <h2 className="mt-8 text-sm font-semibold text-slate-900">
        Tamamlanan Kayıtlar ({completed.length})
      </h2>
      <div className="mt-3">
        <RecordsTable
          records={completed}
          writable={writable}
          deletable={deletable}
          approver={approver}
          canForm={canForm}
          canInvoice={canInvoice}
          emptyMessage="Tamamlanan kayıt yok."
        />
      </div>
    </div>
  );
}

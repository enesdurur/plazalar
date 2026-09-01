"use client";

import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { ApprovalControl } from "@/components/approval-control";
import { AttachmentQuickPanel, type AttachmentInfo } from "@/components/attachment-upload";
import { mtta, mttr, formatMinutes } from "@/lib/kpi";
import {
  deleteRecord,
  setRecordApproval,
  uploadRecordAttachment,
  deleteRecordAttachment,
} from "./actions";
import type { Machine, IssueType, Technician, MaintenanceRecord } from "@prisma/client";

const OPERATION_LABELS: Record<string, string> = {
  ARIZA: "Arıza",
  BAKIM: "Bakım",
};

type RecordWithRelations = Omit<
  MaintenanceRecord,
  "sparePartCost" | "sparePartExchangeRate"
> & {
  sparePartCost: number | null;
  sparePartExchangeRate: number | null;
  formAttachment: AttachmentInfo | null;
  invoiceAttachment: AttachmentInfo | null;
  machine: Machine;
  issueType: IssueType | null;
  technician: Technician | null;
};

export function RecordsTable({
  records,
  writable,
  deletable,
  approver,
  canForm,
  canInvoice,
  emptyMessage,
}: {
  records: RecordWithRelations[];
  writable: boolean;
  deletable: boolean;
  approver: boolean;
  canForm: boolean;
  canInvoice: boolean;
  emptyMessage: string;
}) {
  const columns: DataTableColumn<RecordWithRelations>[] = [
    {
      key: "reportedAt",
      header: "Bildirim Zamanı",
      width: "170px",
      filterValue: (r) => r.reportedAt.toLocaleString("tr-TR"),
      render: (r) => (
        <span className="whitespace-nowrap text-slate-600">
          {r.reportedAt.toLocaleString("tr-TR")}
        </span>
      ),
    },
    {
      key: "machine",
      header: "Makine",
      width: "150px",
      filterValue: (r) => r.machine.name,
      render: (r) => <span className="font-medium text-slate-900">{r.machine.name}</span>,
    },
    {
      key: "operationType",
      header: "Tür",
      width: "90px",
      filterValue: (r) => OPERATION_LABELS[r.operationType],
      render: (r) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            r.operationType === "ARIZA" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
          }`}
        >
          {OPERATION_LABELS[r.operationType]}
        </span>
      ),
    },
    {
      key: "issueType",
      header: "Kategori",
      width: "150px",
      filterValue: (r) => r.issueType?.name ?? "-",
      render: (r) => <span className="text-slate-600">{r.issueType?.name ?? "-"}</span>,
    },
    {
      key: "description",
      header: "Açıklama",
      width: "300px",
      render: (r) => (
        <span className="block truncate text-slate-600" title={r.description}>
          {r.description}
        </span>
      ),
    },
    {
      key: "technician",
      header: "Teknisyen",
      width: "140px",
      filterValue: (r) => r.technician?.name ?? "-",
      render: (r) => <span className="text-slate-600">{r.technician?.name ?? "-"}</span>,
    },
    {
      key: "mtta",
      header: "MTTA",
      width: "80px",
      render: (r) => (
        <span className="text-slate-600">{formatMinutes(mtta(r.reportedAt, r.respondedAt))}</span>
      ),
    },
    {
      key: "mttr",
      header: "MTTR",
      width: "80px",
      render: (r) => (
        <span className="text-slate-600">{formatMinutes(mttr(r.respondedAt, r.finishedAt))}</span>
      ),
    },
    {
      key: "status",
      header: "Durum",
      width: "140px",
      filterValue: (r) => (r.finishedAt ? "Tamamlandı" : "Devam Ediyor"),
      render: (r) =>
        r.finishedAt ? (
          <span className="whitespace-nowrap rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Tamamlandı
          </span>
        ) : (
          <span className="whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            Devam Ediyor
          </span>
        ),
    },
    {
      key: "approved",
      header: "Bütçe Onayı",
      width: "130px",
      filterValue: (r) =>
        r.operationType === "ARIZA" && r.sparePartCost != null
          ? r.approved
            ? "Onaylandı"
            : "Onay Bekliyor"
          : "-",
      render: (r) =>
        r.operationType === "ARIZA" && r.sparePartCost != null ? (
          <ApprovalControl
            approved={r.approved}
            canApprove={approver}
            action={approver ? setRecordApproval.bind(null, r.id) : undefined}
          />
        ) : (
          <span className="text-slate-300">-</span>
        ),
    },
    {
      key: "documents",
      header: "Belgeler",
      width: "160px",
      filterValue: (r) =>
        r.operationType === "ARIZA"
          ? `Form ${r.formAttachment ? "✓" : "✗"} Fatura ${r.invoiceAttachment ? "✓" : "✗"}`
          : "-",
      render: (r) =>
        r.operationType === "ARIZA" ? (
          <AttachmentQuickPanel
            title={`${r.machine.name} · ${r.reportedAt.toLocaleDateString("tr-TR")}`}
            form={r.formAttachment}
            invoice={r.invoiceAttachment}
            canForm={canForm}
            canInvoice={canInvoice}
            uploadFormAction={uploadRecordAttachment.bind(null, r.id)}
            uploadInvoiceAction={uploadRecordAttachment.bind(null, r.id)}
            deleteFormAction={
              r.formAttachment
                ? deleteRecordAttachment.bind(null, r.id, r.formAttachment.id)
                : undefined
            }
            deleteInvoiceAction={
              r.invoiceAttachment
                ? deleteRecordAttachment.bind(null, r.id, r.invoiceAttachment.id)
                : undefined
            }
          />
        ) : (
          <span className="text-slate-300">-</span>
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={records}
      rowKey={(r) => r.id}
      emptyMessage={emptyMessage}
      maxHeight="50vh"
      actionsWidth="110px"
      renderActions={(r) => (
        <>
          {writable && (
            <Link
              href={`/records/${r.id}/edit`}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Düzenle
            </Link>
          )}
          {deletable && <DeleteButton action={deleteRecord.bind(null, r.id)} />}
        </>
      )}
    />
  );
}

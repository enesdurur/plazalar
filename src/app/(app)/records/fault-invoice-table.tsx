"use client";

import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { ApprovalControl } from "@/components/approval-control";
import { AttachmentQuickPanel, type AttachmentInfo } from "@/components/attachment-upload";
import { formatCostAmount } from "@/components/spare-part-cost-tile";
import {
  deleteRecord,
  setRecordApproval,
  uploadRecordAttachment,
  deleteRecordAttachment,
} from "./actions";
import type { Machine, MaintenanceRecord } from "@prisma/client";

type RecordWithRelations = Omit<MaintenanceRecord, "invoiceAmount" | "invoiceExchangeRate"> & {
  invoiceAmount: number | null;
  invoiceExchangeRate: number | null;
  formAttachment?: AttachmentInfo | null;
  invoiceAttachment?: AttachmentInfo | null;
  machine: Machine | null;
};

const GENERAL_WORK_LABEL = "Genel İş";

/** BURGAZ arıza kayıtlarının İş Süreci fatura tutarı — Yedek Parça bütçe kalemine akan
 * kayıtları gösterir (bkz. src/lib/budget/auto-sync.ts sumSpareParts). Yedek parça alanı
 * (sparePartCost) yerine invoiceAmount kullanılır — bkz. costs-table.tsx CostsTable, o
 * eski/legacy sparePartCost akışına özgü. */
export function FaultInvoiceTable({
  records,
  showApproval,
  deletable,
  approver = false,
  canForm = false,
  canInvoice = false,
}: {
  records: RecordWithRelations[];
  showApproval: boolean;
  deletable: boolean;
  approver?: boolean;
  canForm?: boolean;
  canInvoice?: boolean;
}) {
  const columns: DataTableColumn<RecordWithRelations>[] = [
    {
      key: "machine",
      header: "Makine",
      width: "220px",
      filterValue: (r) => r.machine?.name ?? GENERAL_WORK_LABEL,
      render: (r) => (
        <span className="font-medium text-slate-900">{r.machine?.name ?? GENERAL_WORK_LABEL}</span>
      ),
    },
    {
      key: "reportedAt",
      header: "Tarih",
      width: "120px",
      filterValue: (r) => r.reportedAt.toLocaleDateString("tr-TR"),
      render: (r) => (
        <span className="whitespace-nowrap text-slate-600">
          {r.reportedAt.toLocaleDateString("tr-TR")}
        </span>
      ),
    },
    {
      key: "budgetMonth",
      header: "Bütçe Ayı",
      width: "110px",
      filterValue: (r) => (r.budgetMonth ? String(r.budgetMonth) : "Otomatik"),
      render: (r) => (
        <span className="whitespace-nowrap text-slate-600">
          {r.budgetMonth ? `${r.budgetMonth}. Ay` : "Otomatik"}
        </span>
      ),
    },
    {
      key: "contractor",
      header: "Firma",
      width: "180px",
      filterValue: (r) => r.awardedContractor ?? "-",
      render: (r) => <span className="text-slate-600">{r.awardedContractor ?? "-"}</span>,
    },
    {
      key: "amount",
      header: "Fatura Tutarı",
      width: "150px",
      align: "right",
      money: (r) => ({ amount: Number(r.invoiceAmount), currency: r.invoiceCurrency ?? "TRY" }),
      render: (r) => (
        <span className="whitespace-nowrap font-medium tabular-nums text-slate-900">
          {formatCostAmount(Number(r.invoiceAmount), r.invoiceCurrency ?? "TRY")}
        </span>
      ),
    },
    {
      key: "description",
      header: "Açıklama",
      width: "240px",
      render: (r) => (
        <span className="block max-w-xs truncate text-slate-600" title={r.description}>
          {r.description}
        </span>
      ),
    },
    ...(showApproval
      ? [
          {
            key: "approvalDocs",
            header: "Bütçe Onayı / Belgeler",
            width: "190px",
            filterValue: (r: RecordWithRelations) => (r.approved ? "Onaylandı" : "Onay Bekliyor"),
            render: (r: RecordWithRelations) => (
              <div className="flex flex-col items-start gap-1">
                <ApprovalControl
                  approved={r.approved}
                  canApprove={approver}
                  action={approver ? setRecordApproval.bind(null, r.id) : undefined}
                />
                <AttachmentQuickPanel
                  title={`${r.machine?.name ?? GENERAL_WORK_LABEL} · ${r.reportedAt.toLocaleDateString("tr-TR")}`}
                  form={r.formAttachment ?? null}
                  invoice={r.invoiceAttachment ?? null}
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
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <DataTable
      columns={columns}
      rows={records}
      rowKey={(r) => r.id}
      emptyMessage="Henüz fatura tutarı girilmiş bir arıza kaydı yok."
      maxHeight="70vh"
      actionsWidth="130px"
      renderActions={(r) => (
        <>
          <Link
            href={`/records/${r.id}/edit`}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Düzenle
          </Link>
          {deletable && <DeleteButton action={deleteRecord.bind(null, r.id)} />}
        </>
      )}
    />
  );
}

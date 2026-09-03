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
} from "../actions";
import type { Machine, SparePart, MaintenanceRecord } from "@prisma/client";

type RecordWithRelations = Omit<
  MaintenanceRecord,
  "sparePartCost" | "sparePartExchangeRate"
> & {
  sparePartCost: number | null;
  sparePartExchangeRate: number | null;
  formAttachment?: AttachmentInfo | null;
  invoiceAttachment?: AttachmentInfo | null;
  machine: Machine;
  sparePart: SparePart | null;
};

export function CostsTable({
  records,
  showApproval,
  deletable,
  approver = false,
  canForm = false,
  canInvoice = false,
}: {
  records: RecordWithRelations[];
  /** Bütçe Onayı ve Belgeler sütunlarını gösterir. Bu yönetim artık Diğer Giderler
   * sayfasından da yapılabildiği için, bu tablonun bağımsız maliyet inceleme sayfalarındaki
   * (Arıza Maliyetleri vb.) kullanımında false geçilir. */
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
      width: "240px",
      filterValue: (r) => r.machine.name,
      render: (r) => <span className="font-medium text-slate-900">{r.machine.name}</span>,
    },
    {
      key: "reportedAt",
      header: "Tarih",
      width: "150px",
      filterValue: (r) => r.reportedAt.toLocaleDateString("tr-TR"),
      render: (r) => (
        <span className="whitespace-nowrap text-slate-600">
          {r.reportedAt.toLocaleDateString("tr-TR")}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Tutar",
      width: "150px",
      align: "right",
      money: (r) => ({ amount: Number(r.sparePartCost), currency: r.sparePartCostCurrency }),
      render: (r) => (
        <span className="whitespace-nowrap font-medium tabular-nums text-slate-900">
          {formatCostAmount(Number(r.sparePartCost), r.sparePartCostCurrency)}
        </span>
      ),
    },
    {
      key: "sparePart",
      header: "Yedek Parça",
      width: "200px",
      filterValue: (r) => r.sparePart?.name ?? r.sparePartOther ?? "-",
      render: (r) => (
        <span className="text-slate-600">
          {r.sparePart?.name ?? r.sparePartOther ?? "-"}
          {r.sparePartQty ? ` (${r.sparePartQty} adet)` : ""}
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
                  title={`${r.machine.name} · ${r.reportedAt.toLocaleDateString("tr-TR")}`}
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
      emptyMessage="Henüz maliyetli bir bakım kaydı yok."
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

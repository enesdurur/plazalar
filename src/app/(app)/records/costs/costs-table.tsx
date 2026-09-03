"use client";

import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { ApprovalControl } from "@/components/approval-control";
import { AttachmentQuickPanel, type AttachmentInfo } from "@/components/attachment-upload";
import { formatCostAmount } from "@/components/spare-part-cost-tile";
import {
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
  approver = false,
  canForm = false,
  canInvoice = false,
}: {
  records: RecordWithRelations[];
  /** Bütçe Onayı ve Belgeler sütunlarını gösterir. Bu yönetim artık Diğer Giderler
   * sayfasından da yapılabildiği için, bu tablonun bağımsız maliyet inceleme sayfalarındaki
   * (Arıza Maliyetleri vb.) kullanımında false geçilir. */
  showApproval: boolean;
  approver?: boolean;
  canForm?: boolean;
  canInvoice?: boolean;
}) {
  const columns: DataTableColumn<RecordWithRelations>[] = [
    {
      key: "reportedAt",
      header: "Tarih",
      filterValue: (r) => r.reportedAt.toLocaleDateString("tr-TR"),
      render: (r) => (
        <span className="whitespace-nowrap text-slate-600">
          {r.reportedAt.toLocaleDateString("tr-TR")}
        </span>
      ),
    },
    {
      key: "machine",
      header: "Makine",
      filterValue: (r) => r.machine.name,
      render: (r) => <span className="font-medium text-slate-900">{r.machine.name}</span>,
    },
    {
      key: "description",
      header: "Açıklama",
      render: (r) => (
        <span className="block max-w-xs truncate text-slate-600" title={r.description}>
          {r.description}
        </span>
      ),
    },
    {
      key: "sparePart",
      header: "Yedek Parça",
      filterValue: (r) => r.sparePart?.name ?? r.sparePartOther ?? "-",
      render: (r) => (
        <span className="text-slate-600">
          {r.sparePart?.name ?? r.sparePartOther ?? "-"}
          {r.sparePartQty ? ` (${r.sparePartQty} adet)` : ""}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Tutar",
      align: "right",
      money: (r) => ({ amount: Number(r.sparePartCost), currency: r.sparePartCostCurrency }),
      render: (r) => (
        <span className="whitespace-nowrap font-medium tabular-nums text-slate-900">
          {formatCostAmount(Number(r.sparePartCost), r.sparePartCostCurrency)}
        </span>
      ),
    },
    ...(showApproval
      ? [
          {
            key: "approved",
            header: "Bütçe Onayı",
            filterValue: (r: RecordWithRelations) => (r.approved ? "Onaylandı" : "Onay Bekliyor"),
            render: (r: RecordWithRelations) => (
              <ApprovalControl
                approved={r.approved}
                canApprove={approver}
                action={approver ? setRecordApproval.bind(null, r.id) : undefined}
              />
            ),
          },
          {
            key: "documents",
            header: "Belgeler",
            filterValue: (r: RecordWithRelations) =>
              `Form ${r.formAttachment ? "✓" : "✗"} Fatura ${r.invoiceAttachment ? "✓" : "✗"}`,
            render: (r: RecordWithRelations) => (
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
      renderActions={(r) => (
        <Link
          href={`/records/${r.id}/edit`}
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Düzenle
        </Link>
      )}
    />
  );
}

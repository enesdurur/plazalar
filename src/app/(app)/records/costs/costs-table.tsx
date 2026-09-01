"use client";

import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { ApprovalControl } from "@/components/approval-control";
import { AttachmentStatusBadges } from "@/components/attachment-upload";
import { formatCostAmount } from "@/components/spare-part-cost-tile";
import { setRecordApproval } from "../actions";
import type { Machine, SparePart, MaintenanceRecord } from "@prisma/client";

type RecordWithRelations = Omit<
  MaintenanceRecord,
  "sparePartCost" | "sparePartExchangeRate"
> & {
  sparePartCost: number | null;
  sparePartExchangeRate: number | null;
  hasMaintenanceForm: boolean;
  hasInvoice: boolean;
  machine: Machine;
  sparePart: SparePart | null;
};

export function CostsTable({
  records,
  approver,
}: {
  records: RecordWithRelations[];
  approver: boolean;
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
    {
      key: "approved",
      header: "Bütçe Onayı",
      filterValue: (r) => (r.approved ? "Onaylandı" : "Onay Bekliyor"),
      render: (r) => (
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
      filterValue: (r) =>
        `Form ${r.hasMaintenanceForm ? "✓" : "✗"} Fatura ${r.hasInvoice ? "✓" : "✗"}`,
      render: (r) => (
        <AttachmentStatusBadges hasForm={r.hasMaintenanceForm} hasInvoice={r.hasInvoice} />
      ),
    },
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

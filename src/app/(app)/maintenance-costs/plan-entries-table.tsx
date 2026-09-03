"use client";

import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { ApprovalControl } from "@/components/approval-control";
import { AttachmentQuickPanel, type AttachmentInfo } from "@/components/attachment-upload";
import { formatCostAmount } from "@/components/spare-part-cost-tile";
import {
  deletePlanWeekEntry,
  setPlanWeekEntryApproval,
  uploadPlanWeekEntryAttachment,
  deletePlanWeekEntryAttachment,
} from "../annual-plan/actions";
import { monthOfWeek, MONTH_NAMES } from "@/lib/plan/weeks";
import type { MaintenancePlanWeekEntry, MaintenancePlanItem } from "@prisma/client";

type WeekEntryWithItem = Omit<MaintenancePlanWeekEntry, "cost" | "sparePartCost"> & {
  cost: number | null;
  sparePartCost: number | null;
  formAttachment?: AttachmentInfo | null;
  invoiceAttachment?: AttachmentInfo | null;
  item: MaintenancePlanItem;
};

export function PlanEntriesTable({
  entries,
  showApproval,
  deletable = false,
  approver = false,
  canForm = false,
  canInvoice = false,
}: {
  entries: WeekEntryWithItem[];
  /** Bütçe Onayı ve Belgeler sütunlarını gösterir — bu yönetim artık Diğer Giderler
   * sayfasından da yapılabildiği için, bağımsız Bakım Maliyetleri sayfasında false geçilir. */
  showApproval: boolean;
  deletable?: boolean;
  approver?: boolean;
  canForm?: boolean;
  canInvoice?: boolean;
}) {
  const columns: DataTableColumn<WeekEntryWithItem>[] = [
    {
      key: "item",
      header: "Bakım Kalemi",
      width: "240px",
      filterValue: (e) => e.item.label,
      render: (e) => <span className="font-medium text-slate-900">{e.item.label}</span>,
    },
    {
      key: "monthYear",
      header: "Ay / Yıl",
      width: "150px",
      filterValue: (e) => `${MONTH_NAMES[monthOfWeek(e.week) - 1]} ${e.year}`,
      render: (e) => (
        <span className="whitespace-nowrap text-slate-600">
          {MONTH_NAMES[monthOfWeek(e.week) - 1]} {e.year} ({e.week}. hafta)
        </span>
      ),
    },
    {
      key: "amount",
      header: "Bakım Maliyeti",
      width: "150px",
      align: "right",
      money: (e) => (e.cost != null ? { amount: Number(e.cost), currency: e.costCurrency } : null),
      render: (e) =>
        e.cost != null ? (
          <span className="whitespace-nowrap font-medium tabular-nums text-slate-900">
            {formatCostAmount(Number(e.cost), e.costCurrency)}
          </span>
        ) : (
          <span className="text-slate-300">-</span>
        ),
    },
    {
      key: "sparePart",
      header: "Yedek Parça",
      width: "200px",
      align: "right",
      money: (e) =>
        e.sparePartCost != null
          ? { amount: Number(e.sparePartCost), currency: e.sparePartCostCurrency }
          : null,
      render: (e) =>
        e.sparePartCost != null ? (
          <span className="whitespace-nowrap font-medium tabular-nums text-amber-600">
            🔧 {formatCostAmount(Number(e.sparePartCost), e.sparePartCostCurrency)}
            {e.sparePartNote && <span className="ml-1 text-slate-400">({e.sparePartNote})</span>}
          </span>
        ) : (
          <span className="text-slate-300">-</span>
        ),
    },
    ...(showApproval
      ? [
          {
            key: "approvalDocs",
            header: "Bütçe Onayı / Belgeler",
            width: "190px",
            filterValue: (e: WeekEntryWithItem) => (e.approved ? "Onaylandı" : "Onay Bekliyor"),
            render: (e: WeekEntryWithItem) => (
              <div className="flex flex-col items-start gap-1">
                <ApprovalControl
                  approved={e.approved}
                  canApprove={approver}
                  action={approver ? setPlanWeekEntryApproval.bind(null, e.id) : undefined}
                />
                <AttachmentQuickPanel
                  title={`${e.item.label} · ${MONTH_NAMES[monthOfWeek(e.week) - 1]} ${e.year}`}
                  form={e.formAttachment ?? null}
                  invoice={e.invoiceAttachment ?? null}
                  canForm={canForm}
                  canInvoice={canInvoice}
                  uploadFormAction={uploadPlanWeekEntryAttachment.bind(null, e.id)}
                  uploadInvoiceAction={uploadPlanWeekEntryAttachment.bind(null, e.id)}
                  deleteFormAction={
                    e.formAttachment
                      ? deletePlanWeekEntryAttachment.bind(null, e.id, e.formAttachment.id)
                      : undefined
                  }
                  deleteInvoiceAction={
                    e.invoiceAttachment
                      ? deletePlanWeekEntryAttachment.bind(null, e.id, e.invoiceAttachment.id)
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
      rows={entries}
      rowKey={(e) => e.id}
      emptyMessage="Henüz maliyetli bir yıllık bakım kaydı yok."
      maxHeight="50vh"
      actionsWidth="130px"
      renderActions={(e) => (
        <>
          <Link
            href={`/annual-plan/entries/${e.id}/edit`}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Düzenle
          </Link>
          {deletable && <DeleteButton action={deletePlanWeekEntry.bind(null, e.id)} />}
        </>
      )}
    />
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { ApprovalControl } from "@/components/approval-control";
import { AttachmentUpload, type AttachmentInfo } from "@/components/attachment-upload";
import {
  deleteOtherExpense,
  setOtherExpenseApproval,
  uploadOtherExpenseAttachment,
  deleteOtherExpenseAttachment,
} from "./actions";

const MONTH_NAMES = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export interface OtherExpenseRow {
  id: string;
  lineItemId: string;
  lineItemLabel: string;
  month: number;
  amount: number;
  note: string | null;
  approved: boolean;
  approvedByName: string | null;
  createdByName: string | null;
  attachment: AttachmentInfo | null;
}

export function OtherExpensesTable({
  entries,
  writable,
  deletable,
  approver,
}: {
  entries: OtherExpenseRow[];
  writable: boolean;
  deletable: boolean;
  approver: boolean;
}) {
  const columns: DataTableColumn<OtherExpenseRow>[] = [
    {
      key: "lineItem",
      header: "Kalem",
      width: "240px",
      filterValue: (r) => r.lineItemLabel,
      render: (r) => <span className="font-medium text-slate-900">{r.lineItemLabel}</span>,
    },
    {
      key: "month",
      header: "Ay",
      width: "150px",
      filterValue: (r) => MONTH_NAMES[r.month - 1],
      render: (r) => <span className="text-slate-600">{MONTH_NAMES[r.month - 1]}</span>,
    },
    {
      key: "amount",
      header: "Tutar",
      width: "150px",
      render: (r) => (
        <span className="whitespace-nowrap font-medium tabular-nums text-slate-900">
          {r.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
          TL
        </span>
      ),
    },
    {
      key: "note",
      header: "Not",
      width: "260px",
      render: (r) => (
        <span className="block max-w-[260px] truncate text-slate-500" title={r.note ?? ""}>
          {r.note ?? "-"}
        </span>
      ),
    },
    {
      key: "createdBy",
      header: "Giren",
      width: "180px",
      filterValue: (r) => r.createdByName ?? "-",
      render: (r) => <span className="text-slate-500">{r.createdByName ?? "-"}</span>,
    },
    {
      key: "approvalDocs",
      header: "Bütçe Onayı / Belgeler",
      width: "190px",
      filterValue: (r) => (r.approved ? "Onaylandı" : "Onay Bekliyor"),
      render: (r) => (
        <div className="flex flex-col items-start gap-1">
          <ApprovalControl
            approved={r.approved}
            canApprove={approver}
            action={approver ? setOtherExpenseApproval.bind(null, r.id) : undefined}
          />
          <DocumentCell
            attachment={r.attachment}
            canManage={writable}
            uploadAction={uploadOtherExpenseAttachment.bind(null, r.id)}
            deleteAction={
              r.attachment
                ? deleteOtherExpenseAttachment.bind(null, r.id, r.attachment.id)
                : undefined
            }
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={entries}
      rowKey={(r) => r.id}
      emptyMessage="Henüz kayıt yok."
      maxHeight="70vh"
      actionsWidth="110px"
      renderActions={(r) => (
        <>
          {writable && (
            <Link
              href={`/other-expenses/${r.id}/edit`}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Düzenle
            </Link>
          )}
          {deletable && <DeleteButton action={deleteOtherExpense.bind(null, r.id)} />}
        </>
      )}
    />
  );
}

type AttachmentActionFn = (formData: FormData) => Promise<{ error: string | null }>;

/** "Belge" hücresi: tek bir rozet, tıklanınca yükleme/görüntüleme paneli açılır — kayıt
 * başına tek destekleyici belge (fatura/form) yeterli, ayrı form+fatura ayrımına gerek yok. */
function DocumentCell({
  attachment,
  canManage,
  uploadAction,
  deleteAction,
}: {
  attachment: AttachmentInfo | null;
  canManage: boolean;
  uploadAction: AttachmentActionFn;
  deleteAction?: AttachmentActionFn;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Belgeyi görüntüle / yükle"
        className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium hover:opacity-80 ${
          attachment ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}
      >
        Belge {attachment ? "✓" : "✗"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">Destekleyici Belge</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Kapat"
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="mt-4">
              <AttachmentUpload
                label="Fatura / Belge"
                kind="INVOICE"
                attachment={attachment}
                canManage={canManage}
                uploadAction={uploadAction}
                deleteAction={deleteAction}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

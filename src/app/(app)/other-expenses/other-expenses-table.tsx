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

// Bu kalemlerde tek bir fatura yeterli — bakım formu vb. ayrı bir belge söz konusu değil.
// Listelenmeyen tüm kalemlerde (Wc sarf malzeme giderleri, Peyzaj Giderleri gibi — alınan
// malzemenin belgesi de eklenebilsin diye) hem Fatura hem Belge için ayrı yükleme alanı açılır.
const INVOICE_ONLY_LABELS = [
  "Ortak Alan Elektrik",
  "Ortak Alan Su Kullanımı",
  "İlaçlama Hizmetleri",
  "Dış Cephe Temizliği",
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
  invoiceAttachment: AttachmentInfo | null;
  formAttachment: AttachmentInfo | null;
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
          {INVOICE_ONLY_LABELS.includes(r.lineItemLabel) ? (
            <DocumentCell
              attachment={r.invoiceAttachment}
              canManage={writable}
              uploadAction={uploadOtherExpenseAttachment.bind(null, r.id)}
              deleteAction={
                r.invoiceAttachment
                  ? deleteOtherExpenseAttachment.bind(null, r.id, r.invoiceAttachment.id)
                  : undefined
              }
            />
          ) : (
            <DualDocumentCell
              invoiceAttachment={r.invoiceAttachment}
              formAttachment={r.formAttachment}
              canManage={writable}
              uploadAction={uploadOtherExpenseAttachment.bind(null, r.id)}
              deleteInvoiceAction={
                r.invoiceAttachment
                  ? deleteOtherExpenseAttachment.bind(null, r.id, r.invoiceAttachment.id)
                  : undefined
              }
              deleteFormAction={
                r.formAttachment
                  ? deleteOtherExpenseAttachment.bind(null, r.id, r.formAttachment.id)
                  : undefined
              }
            />
          )}
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

/** "Fatura" hücresi: tek bir rozet, tıklanınca yükleme/görüntüleme paneli açılır — bu
 * kalemlerde (ör. Ortak Alan Elektrik) yalnızca fatura yeterli, ayrı bir belge gerekmez. */
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
        title="Faturayı görüntüle / yükle"
        className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium hover:opacity-80 ${
          attachment ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}
      >
        Fatura {attachment ? "✓" : "✗"}
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
              <h3 className="text-sm font-semibold text-slate-900">Fatura</h3>
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
                label="Fatura"
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

/** "Fatura / Belge" hücresi: bu kalemlerde faturanın yanında ayrı bir destekleyici belge de
 * (ör. alınan malzemenin listesi) yüklenebilsin diye iki ayrı yükleme alanı olan rozet çifti. */
function DualDocumentCell({
  invoiceAttachment,
  formAttachment,
  canManage,
  uploadAction,
  deleteInvoiceAction,
  deleteFormAction,
}: {
  invoiceAttachment: AttachmentInfo | null;
  formAttachment: AttachmentInfo | null;
  canManage: boolean;
  uploadAction: AttachmentActionFn;
  deleteInvoiceAction?: AttachmentActionFn;
  deleteFormAction?: AttachmentActionFn;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Belgeleri görüntüle / yükle"
        className="flex flex-wrap gap-1 rounded hover:opacity-80"
      >
        <span
          className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
            invoiceAttachment ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          Fatura {invoiceAttachment ? "✓" : "✗"}
        </span>
        <span
          className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
            formAttachment ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          Belge {formAttachment ? "✓" : "✗"}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-lg bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">Fatura / Belge</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Kapat"
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <AttachmentUpload
                label="Fatura"
                kind="INVOICE"
                attachment={invoiceAttachment}
                canManage={canManage}
                uploadAction={uploadAction}
                deleteAction={deleteInvoiceAction}
              />
              <AttachmentUpload
                label="Belge"
                kind="MAINTENANCE_FORM"
                attachment={formAttachment}
                canManage={canManage}
                uploadAction={uploadAction}
                deleteAction={deleteFormAction}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

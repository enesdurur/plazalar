"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

export interface AttachmentInfo {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  uploaderName: string | null;
}

const ACCEPT = ".pdf,image/jpeg,image/png,image/webp,image/heic,image/heif";

function UploadButton({ hasExisting }: { hasExisting: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="whitespace-nowrap rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      {pending ? "Yükleniyor…" : hasExisting ? "Değiştir" : "Yükle"}
    </button>
  );
}

function StatusBadge({ label, present }: { label: string; present: boolean }) {
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
        present ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      {label} {present ? "✓" : "✗"}
    </span>
  );
}

type AttachmentActionFn = (formData: FormData) => Promise<{ error: string | null }>;

/**
 * "Form ✓ / Fatura ✗" rozetleri — liste/rapor tablolarında hızlı eksik-belge kontrolü için.
 * Tıklanınca o kayda ait belgeleri görüntüleyip yükleyebileceğin bir panel açılır; ayrı bir
 * "Düzenle" sayfasına gitmeye gerek kalmaz.
 */
export function AttachmentQuickPanel({
  title,
  form,
  invoice,
  canForm,
  canInvoice,
  uploadFormAction,
  uploadInvoiceAction,
  deleteFormAction,
  deleteInvoiceAction,
}: {
  title: string;
  form: AttachmentInfo | null;
  invoice: AttachmentInfo | null;
  canForm: boolean;
  canInvoice: boolean;
  uploadFormAction: AttachmentActionFn;
  uploadInvoiceAction: AttachmentActionFn;
  deleteFormAction?: AttachmentActionFn;
  deleteInvoiceAction?: AttachmentActionFn;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Belgeleri görüntüle / yükle"
        className="flex flex-wrap gap-1 rounded hover:opacity-80"
      >
        <StatusBadge label="Form" present={!!form} />
        <StatusBadge label="Fatura" present={!!invoice} />
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
              <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
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
                label="Bakım Formu"
                kind="MAINTENANCE_FORM"
                attachment={form}
                canManage={canForm}
                uploadAction={uploadFormAction}
                deleteAction={deleteFormAction}
              />
              <AttachmentUpload
                label="Fatura"
                kind="INVOICE"
                attachment={invoice}
                canManage={canInvoice}
                uploadAction={uploadInvoiceAction}
                deleteAction={deleteInvoiceAction}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function AttachmentUpload({
  label,
  kind,
  attachment,
  canManage,
  uploadAction,
  deleteAction,
}: {
  label: string;
  kind: "INVOICE" | "MAINTENANCE_FORM";
  attachment: AttachmentInfo | null;
  canManage: boolean;
  uploadAction: (formData: FormData) => Promise<{ error: string | null }>;
  deleteAction?: (formData: FormData) => Promise<{ error: string | null }>;
}) {
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(formData: FormData) {
    setError(null);
    const result = await uploadAction(formData);
    if (result.error) setError(result.error);
  }

  async function handleDelete(formData: FormData) {
    setError(null);
    const result = await deleteAction!(formData);
    if (result.error) setError(result.error);
  }

  return (
    <div className="rounded-md border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {!attachment && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            Eklenmedi
          </span>
        )}
      </div>

      {attachment && (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm">
          <a
            href={attachment.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate font-medium text-blue-600 hover:underline"
            title={attachment.fileName}
          >
            📎 {attachment.fileName}
          </a>
          <span className="whitespace-nowrap text-xs text-slate-400">
            {attachment.uploaderName ?? "?"} ·{" "}
            {new Date(attachment.uploadedAt).toLocaleDateString("tr-TR")}
          </span>
        </div>
      )}

      {canManage ? (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <form
              key={attachment?.id ?? "empty"}
              action={handleUpload}
              className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
            >
              <input type="hidden" name="kind" value={kind} />
              <input
                type="file"
                name="file"
                accept={ACCEPT}
                required
                className="block min-w-0 flex-1 text-xs text-slate-600 file:mr-2 file:rounded file:border-0 file:bg-slate-900 file:px-2 file:py-1 file:text-xs file:font-medium file:text-white file:hover:bg-slate-800"
              />
              <UploadButton hasExisting={!!attachment} />
            </form>
            {attachment && deleteAction && (
              <form action={handleDelete}>
                <button
                  type="submit"
                  className="whitespace-nowrap text-xs font-medium text-red-600 hover:underline"
                >
                  Sil
                </button>
              </form>
            )}
          </div>
          {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
        </>
      ) : (
        <p className="mt-2 text-xs text-slate-400">
          Bu dosyayı yalnızca yetkili roller ekleyebilir/değiştirebilir.
        </p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
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

/** Kompakt "Form ✓ / Fatura ✗" göstergesi — liste/rapor tablolarında hızlı eksik-belge kontrolü için. */
export function AttachmentStatusBadges({
  hasForm,
  hasInvoice,
}: {
  hasForm: boolean;
  hasInvoice: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      <span
        className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
          hasForm ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}
      >
        Form {hasForm ? "✓" : "✗"}
      </span>
      <span
        className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
          hasInvoice ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}
      >
        Fatura {hasInvoice ? "✓" : "✗"}
      </span>
    </div>
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
          <div className="mt-2 flex items-center gap-2">
            <form
              key={attachment?.id ?? "empty"}
              action={handleUpload}
              className="flex flex-1 items-center gap-2"
            >
              <input type="hidden" name="kind" value={kind} />
              <input
                type="file"
                name="file"
                accept={ACCEPT}
                required
                className="block flex-1 text-xs text-slate-600 file:mr-2 file:rounded file:border-0 file:bg-slate-900 file:px-2 file:py-1 file:text-xs file:font-medium file:text-white file:hover:bg-slate-800"
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

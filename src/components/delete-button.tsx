"use client";

import { useState } from "react";

export function DeleteButton({
  action,
  confirmMessage = "Silmek istediğinize emin misiniz?",
}: {
  action: () => Promise<void>;
  confirmMessage?: string;
}) {
  const [deleting, setDeleting] = useState(false);

  return (
    <form
      action={async () => {
        if (!confirm(confirmMessage)) return;
        setDeleting(true);
        try {
          await action();
        } finally {
          setDeleting(false);
        }
      }}
    >
      <button
        type="submit"
        disabled={deleting}
        className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-60"
      >
        {deleting ? "Siliniyor..." : "Sil"}
      </button>
    </form>
  );
}

"use client";

export function DeleteButton({
  action,
  confirmMessage = "Silmek istediğinize emin misiniz?",
}: {
  action: () => Promise<void>;
  confirmMessage?: string;
}) {
  return (
    <form
      action={async () => {
        if (confirm(confirmMessage)) {
          await action();
        }
      }}
    >
      <button
        type="submit"
        className="text-sm font-medium text-red-600 hover:text-red-800"
      >
        Sil
      </button>
    </form>
  );
}

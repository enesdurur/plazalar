import { validityStatus, VALIDITY_LABELS, VALIDITY_CLASSES } from "@/lib/status";

export function StatusBadge({ nextDate }: { nextDate: Date | null | undefined }) {
  const status = validityStatus(nextDate);
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${VALIDITY_CLASSES[status]}`}>
      {VALIDITY_LABELS[status]}
    </span>
  );
}

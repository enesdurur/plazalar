// MTTA: reported -> responded (müdahale süresi)
// MTTR: responded -> finished (onarım süresi)

export function minutesBetween(from: Date | null | undefined, to: Date | null | undefined) {
  if (!from || !to) return null;
  return Math.round((to.getTime() - from.getTime()) / 60000);
}

export function mtta(reportedAt: Date, respondedAt: Date | null) {
  return minutesBetween(reportedAt, respondedAt);
}

export function mttr(respondedAt: Date | null, finishedAt: Date | null) {
  return minutesBetween(respondedAt, finishedAt);
}

// Kayıt tarihleri artık saat içermiyor (bkz. record-form.tsx date input'ları) — MTTA/MTTR
// şuanlık günlük olarak gösteriliyor.
export function formatDays(minutes: number | null) {
  if (minutes === null) return "-";
  const days = Math.round(minutes / 1440);
  return `${days} gün`;
}

export function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

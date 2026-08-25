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

export function formatMinutes(minutes: number | null) {
  if (minutes === null) return "-";
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} sa` : `${hours} sa ${rest} dk`;
}

export function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

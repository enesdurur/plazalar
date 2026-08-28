/** Yıllık Bakım Planı / Periyodik (Fenni) Muayene Excel'lerindeki hafta bölünmesi: her ay
 * eşit 4-5 haftaya değil, Excel'in kendi sütun sayısına göre bölünmüş, 1'den 53'e kadar
 * kesintisiz numaralandırılmış. Bu sabit, o bölünmeyi birebir yansıtır. */
export const MONTH_NAMES = [
  "OCAK",
  "ŞUBAT",
  "MART",
  "NİSAN",
  "MAYIS",
  "HAZİRAN",
  "TEMMUZ",
  "AĞUSTOS",
  "EYLÜL",
  "EKİM",
  "KASIM",
  "ARALIK",
];

const MONTH_WEEK_COUNTS = [5, 4, 4, 4, 5, 4, 5, 4, 4, 5, 4, 5];

export const TOTAL_WEEKS = MONTH_WEEK_COUNTS.reduce((a, b) => a + b, 0); // 53

/** Her ayın hangi hafta aralığında olduğu: [{ month: 1..12, startWeek, endWeek }] */
export const MONTH_WEEK_RANGES: { month: number; startWeek: number; endWeek: number }[] = (() => {
  const ranges = [];
  let week = 1;
  for (let m = 0; m < 12; m++) {
    const count = MONTH_WEEK_COUNTS[m];
    ranges.push({ month: m + 1, startWeek: week, endWeek: week + count - 1 });
    week += count;
  }
  return ranges;
})();

/** Verilen hafta numarasının (1-53) hangi aya (1-12) ait olduğunu döndürür. */
export function monthOfWeek(week: number): number {
  const range = MONTH_WEEK_RANGES.find((r) => week >= r.startWeek && week <= r.endWeek);
  return range?.month ?? 12;
}

/** Bugünün tarihine göre bu ayın (ve dolayısıyla haftasının) geçmişte kalıp kalmadığı: yalnızca
 * geçmiş yıllar ve geçmiş aylar "geçti" sayılır — içinde bulunulan ay henüz "geçmiş" değildir,
 * o ayın haftaları da elle işaretlenmeyi bekleyen etkileşimli kutucuklar olarak kalır. */
export function isPastWeek(year: number, week: number, now: Date = new Date()): boolean {
  if (year < now.getFullYear()) return true;
  if (year > now.getFullYear()) return false;
  return monthOfWeek(week) < now.getMonth() + 1;
}

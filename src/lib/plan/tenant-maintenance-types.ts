import { MONTH_WEEK_RANGES } from "./weeks";

/** Kiracı Bakımları için standart bakım türleri. Yeni bir tür eklemek için buraya ekleyin —
 * seed.ts her kiracı için eksik olan türleri otomatik olarak oluşturur. */
export const TENANT_MAINTENANCE_TYPES = ["Fancoil Bakımı", "Elektrik Bakımı"] as const;

/** Başlangıç varsayımı: ayda bir kez, her ayın ilk haftasında. Gerçek periyot netleşince
 * kalem bazında (Kalemleri Yönet üzerinden) değiştirilebilir. */
export function defaultMonthlyScheduledWeeks(): number[] {
  return MONTH_WEEK_RANGES.map((r) => r.startWeek);
}

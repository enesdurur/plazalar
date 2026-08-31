/** Kiracı Bakımları için standart bakım türleri ve her birinin yıllık planlanan haftası.
 * Yeni bir tür eklemek için buraya ekleyin — seed.ts her kiracı için eksik olan türleri
 * otomatik oluşturur ve mevcut olanların scheduledWeeks'ini bu tabloyla senkron tutar.
 *
 * Hafta numaraları lib/plan/weeks.ts'deki 1-53 şemasına göre: Elektrik Bakımı yılda 1 kez,
 * Mayıs ayının ortası (~15'i) → hafta 20; Fancoil Bakımı yılda 1 kez, Haziran ayının ortası
 * (~15'i) → hafta 24. */
export const TENANT_MAINTENANCE_SCHEDULES: Record<string, number[]> = {
  "Fancoil Bakımı": [24],
  "Elektrik Bakımı": [20],
};

export const TENANT_MAINTENANCE_TYPES = Object.keys(
  TENANT_MAINTENANCE_SCHEDULES
) as (keyof typeof TENANT_MAINTENANCE_SCHEDULES)[];

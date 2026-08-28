/** Link Plaza 2026 "Yıllık Bakım Planı" Excel'inden (Periyodik_Muayeneler.xlsx, "BAKIM"
 * sütunu) birebir aktarılmış kalem listesi. machineName doluysa, mevcut Machine kaydıyla
 * (tekil ve net eşleşen durumlarda) ilişkilendirilir — seed.ts bu isimle Machine'i bulur. */
export interface PlanItemSeed {
  label: string;
  company: string;
  yearlyCount: number;
  machineName?: string;
  /** Excel'de renkli/işaretli hücrelerin karşılık geldiği hafta numaraları (1-53) — bu kalemin
   * o yıl için planlanan gerçekleşme haftaları, hücre hücre Excel'den okunarak çıkarıldı. */
  scheduledWeeks: number[];
}

export const MAINTENANCE_PLAN_ITEMS_2026: PlanItemSeed[] = [
  { label: "TRAFO İŞLETME SORUMLULUĞU", company: "VALANS MÜHENDİSLİK", yearlyCount: 12, machineName: "TRAFO-01", scheduledWeeks: [3, 7, 11, 15, 19, 24, 29, 33, 37, 42, 47, 51] },
  { label: "TRAFO KESİCİ VE O.G. HÜCRE BAKIMI", company: "VALANS MÜHENDİSLİK", yearlyCount: 1, machineName: "KESİCİ-01", scheduledWeeks: [25] },
  { label: "JENERATÖR BAKIMI", company: "YAKAMOZ MAKİNA", yearlyCount: 3, scheduledWeeks: [10, 28, 47] },
  { label: "CHİLLER GRUPLARI", company: "BİRSO SOĞUTMA", yearlyCount: 1, scheduledWeeks: [27] },
  { label: "HAVALANDIRMA SANTRALLERİ VE ISI GERİ KAZANIM CİHAZI", company: "EMR KLİMA", yearlyCount: 2, scheduledWeeks: [11, 38] },
  { label: "ISITMA KAZANLARI", company: "VİESSMANN", yearlyCount: 1, scheduledWeeks: [38] },
  { label: "OTOPARK JET FANLARI", company: "ATC", yearlyCount: 1, scheduledWeeks: [23] },
  { label: "ASANSÖR", company: "OTİS", yearlyCount: 12, scheduledWeeks: [1, 6, 10, 14, 18, 23, 27, 32, 36, 40, 45, 49] },
  { label: "YANGIN SÖNDÜRME KOLLEKTÖR VE POMPALAR", company: "EMECH", yearlyCount: 2, scheduledWeeks: [22, 47] },
  { label: "SU KİMYASALLARI ANALİZİ (MEKANİK TESİSAT)", company: "OMC", yearlyCount: 12, scheduledWeeks: [3, 7, 11, 16, 21, 24, 29, 34, 38, 42, 47, 51] },
  { label: "YANGIN TÜPLERİ VE DOLAPLARI", company: "ISS-HASSA", yearlyCount: 12, machineName: "YANGIN DOLABI", scheduledWeeks: [3, 7, 11, 16, 21, 24, 29, 34, 37, 38, 42, 47, 51] },
  { label: "UPS", company: "ISS-ERK ENERJİ", yearlyCount: 12, machineName: "UPS-01", scheduledWeeks: [1, 6, 10, 14, 18, 23, 27, 28, 32, 36, 40, 45, 49] },
  { label: "MEKANİK OTOMASYON", company: "TMS", yearlyCount: 1, scheduledWeeks: [44] },
  { label: "ZAYIF AKIM SİSTEMLERİ / YANGIN SİS. OTOMASYON", company: "İNTERTEC", yearlyCount: 1, machineName: "YANGIN İHBAR PANELİ", scheduledWeeks: [34] },
  { label: "DIŞ CEPHE ASANSÖR BAKIMI", company: "SAB MAKİNA", yearlyCount: 2, machineName: "DIŞ CEPHE ASANSÖRÜ", scheduledWeeks: [18, 42] },
  { label: "DIŞ CEPHE SİLİMİ", company: "SAB MAKİNA", yearlyCount: 2, scheduledWeeks: [26, 42] },
  { label: "SU DEPOLARI TEMİZLİĞİ", company: "İSTTEM", yearlyCount: 1, scheduledWeeks: [33] },
];

/** Link Plaza 2026 "Periyodik (Fenni) Muayene" Excel'inden (Fenni_Muayeneler.xlsx, "FENNİ
 * MUAYENE" sütunu) birebir aktarılmış kalem listesi. */
export const INSPECTION_PLAN_ITEMS_2026: PlanItemSeed[] = [
  { label: "ASANSÖR KONTROLLERİ", company: "D-KARE", yearlyCount: 1, scheduledWeeks: [32] },
  { label: "BASINÇLANDIRMA VE HAVALANDIRMA SİSTEMİ KONTROLÜ", company: "DETAM", yearlyCount: 1, scheduledWeeks: [23] },
  { label: "PARATONER-TOPRAKLAMA İÇ TESİSAT KONTROLÜ", company: "DETAM", yearlyCount: 1, scheduledWeeks: [23] },
  { label: "KAZAN VE JENERATÖR KONTROLÜ", company: "DETAM", yearlyCount: 1, scheduledWeeks: [23] },
  { label: "GENLEŞME TANKI VE HİDROFOR KONTROLÜ", company: "DETAM", yearlyCount: 1, scheduledWeeks: [23] },
  { label: "YANGIN POMPALARI PERFORMANS TESTİ", company: "DETAM", yearlyCount: 1, scheduledWeeks: [39] },
  { label: "YANGIN SÖNDÜRME TESİSATI SİSTEMİ KONTROLÜ", company: "DETAM", yearlyCount: 1, scheduledWeeks: [39] },
  { label: "ASILI ERİŞİM DONANIMI KONTROLÜ", company: "DETAM", yearlyCount: 1, machineName: "DIŞ CEPHE ASANSÖRÜ", scheduledWeeks: [18] },
];

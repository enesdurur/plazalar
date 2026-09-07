import type { PlanItemSeed } from "./link-plaza-2026";

/** Olive Plaza 2026 "Yıllık Bakım Planı" Excel'inden (YILLIK__BAKIM_PLANLARI_2026__Olive.xlsx,
 * "OLİVE 2026" sayfası) birebir aktarılmış kalem listesi. machineNames doluysa, mevcut Machine
 * kayıtlarıyla (bir kalemin etkilediği tüm makinelerle — ör. "Asansör Bakımı" binadaki tüm
 * asansörlerle) ilişkilendirilir — seed.ts bu isimlerle Machine'leri bulur. */
export const MAINTENANCE_PLAN_ITEMS_OLIVE_2026: PlanItemSeed[] = [
  { label: "TRAFO İŞLETME SORUMLULUĞU", company: "VALANS MÜHENDİSLİK", yearlyCount: 12, machineNames: ["TRAFO"], scheduledWeeks: [3, 7, 11, 15, 19, 24, 29, 33, 37, 42, 47, 51] },
  { label: "TRAFO KESİCİ VE O.G. HÜCRE BAKIMI", company: "VALANS MÜHENDİSLİK", yearlyCount: 1, machineNames: ["KESİCİ"], scheduledWeeks: [25] },
  { label: "JENERATÖR BAKIMI", company: "YAKAMOZ MAKİNA", yearlyCount: 3, machineNames: ["JENERATÖR-01", "JENERATÖR-02"], scheduledWeeks: [10, 28, 47] },
  { label: "CHİLLER GRUPLARI", company: "BİRSO SOĞUTMA", yearlyCount: 1, machineNames: ["CHİLLER-01", "CHİLLER-02"], scheduledWeeks: [27] },
  { label: "HAVALANDIRMA SANTRALLERİ VE ISI GERİ KAZANIM CİHAZI", company: "EMR KLİMA", yearlyCount: 2, scheduledWeeks: [11, 38] },
  { label: "ISITMA KAZANLARI", company: "VİESSMANN", yearlyCount: 1, machineNames: ["KAZAN-01", "KAZAN-02"], scheduledWeeks: [38] },
  { label: "ASANSÖR", company: "OTİS", yearlyCount: 12, machineNames: ["ASANSÖR-01", "ASANSÖR-02", "ASANSÖR-03", "ASANSÖR-04", "ASANSÖR-05"], scheduledWeeks: [1, 6, 10, 14, 18, 23, 27, 32, 36, 40, 45, 49] },
  { label: "YANGIN SÖNDÜRME KOLLEKTÖR VE POMPALAR", company: "EMECH", yearlyCount: 2, machineNames: ["DİZEL YANGIN POMPASI", "ELEKTRİKLİ YANGIN POMPASI"], scheduledWeeks: [22, 47] },
  { label: "SU KİMYASALLARI ANALİZİ(MEKANİK TESİSAT)", company: "OMC", yearlyCount: 12, scheduledWeeks: [3, 7, 11, 16, 21, 24, 29, 34, 38, 42, 47, 51] },
  { label: "YANGIN TÜPLERİ VE DOLAPLARI", company: "ISS-HASSA", yearlyCount: 12, machineNames: ["YANGIN DOLABI (21 adet)"], scheduledWeeks: [3, 7, 11, 16, 21, 24, 29, 34, 37, 38, 42, 47, 51] },
  { label: "UPS", company: "ISS-ERK ENERJİ", yearlyCount: 12, machineNames: ["UPS-01", "UPS-02"], scheduledWeeks: [1, 6, 10, 14, 18, 23, 27, 28, 32, 36, 40, 45, 49] },
  { label: "MEKANİK OTOMASYON", company: "TMS", yearlyCount: 1, scheduledWeeks: [44] },
  { label: "ZAYIF AKIM SİSTEMLERİ/YANGIN SİS.OTOMASYON", company: "PRONET", yearlyCount: 1, machineNames: ["YANGIN İHBAR PANELİ (3 adet)"], scheduledWeeks: [29] },
  { label: "DIŞ CEPHE ASANSÖR BAKIMI", company: "SAB MAKİNA", yearlyCount: 2, machineNames: ["DIŞ CEPHE ASANSÖRÜ"], scheduledWeeks: [22, 42] },
  { label: "DIŞ CEPHE SİLİMİ", company: "SAB MAKİNA", yearlyCount: 2, scheduledWeeks: [26, 42] },
  { label: "SU DEPOLARI TEMİZLİĞİ", company: "İSTTEM", yearlyCount: 1, scheduledWeeks: [25] },
];

/** Olive Plaza 2026 "Periyodik (Fenni) Muayene" Excel'inden (YILLIK__BAKIM_PLANLARI_2026__Olive.xlsx,
 * "OLİVE 2026" sayfası, "FENNİ MUAYENE" bölümü) birebir aktarılmış kalem listesi. */
export const INSPECTION_PLAN_ITEMS_OLIVE_2026: PlanItemSeed[] = [
  { label: "ASANSÖR KONTROLLERİ", company: "D-KARE", yearlyCount: 1, machineNames: ["ASANSÖR-01", "ASANSÖR-02", "ASANSÖR-03", "ASANSÖR-04", "ASANSÖR-05"], scheduledWeeks: [32] },
  { label: "BASINÇLANDIRMA VE HAVALANDIRMA SİSTEMİ KONTROLÜ", company: "DETAM", yearlyCount: 1, machineNames: ["BASINÇLANDIRMA FANLARI-01", "BASINÇLANDIRMA FANLARI-02", "BASINÇLANDIRMA FANLARI-03"], scheduledWeeks: [23] },
  { label: "PARATONER-TOPRAKLAMA İÇ TESİSAT KONTROLÜ", company: "DETAM", yearlyCount: 1, scheduledWeeks: [23] },
  { label: "KAZAN VE JENERATÖR KONTROLÜ", company: "DETAM", yearlyCount: 1, machineNames: ["KAZAN-01", "KAZAN-02", "JENERATÖR-01", "JENERATÖR-02"], scheduledWeeks: [23] },
  { label: "GENLEŞME TANKI VE HİDROFOR KONTROLÜ", company: "DETAM", yearlyCount: 1, machineNames: ["KULLANMA SUYU HİDRAFOR-01", "KULLANMA SUYU HİDRAFOR-02", "KULLANMA SUYU HİDRAFOR-03", "REZERVUAR SUYU HİDRAFOR-01", "REZERVUAR SUYU HİDRAFOR-02"], scheduledWeeks: [23] },
  { label: "YANGIN POMPALARI PERFORMANS TESTİ", company: "DETAM", yearlyCount: 1, machineNames: ["DİZEL YANGIN POMPASI", "ELEKTRİKLİ YANGIN POMPASI"], scheduledWeeks: [22] },
  { label: "YANGIN SÖNDÜRME TESİSATI SİSTEMİ KONTROLÜ", company: "DETAM", yearlyCount: 1, scheduledWeeks: [22] },
  { label: "ASILI ERİŞİM DONANIMI KONTROLÜ", company: "DETAM", yearlyCount: 1, machineNames: ["DIŞ CEPHE ASANSÖRÜ"], scheduledWeeks: [22] },
];

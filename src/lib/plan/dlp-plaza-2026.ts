import type { PlanItemSeed } from "./link-plaza-2026";

/** DLP No.1 Plaza 2026 "Yıllık Bakım Planı" Excel'inden (YILLIK__BAKIM_PLANLARI_2026.xlsx,
 * "DLP 2026" sayfası) birebir aktarılmış kalem listesi. machineNames doluysa, mevcut Machine
 * kayıtlarıyla (bir kalemin etkilediği tüm makinelerle) ilişkilendirilir. */
export const MAINTENANCE_PLAN_ITEMS_DLP_2026: PlanItemSeed[] = [
  { label: "TRAFO İŞLETME SORUMLULUĞU", company: "VALANS MÜHENDİSLİK", yearlyCount: 12, scheduledWeeks: [3, 7, 11, 15, 19, 24, 29, 33, 37, 42, 47, 51] },
  { label: "TRAFO KESİCİ VE O.G. HÜCRE BAKIMI", company: "VALANS MÜHENDİSLİK", yearlyCount: 1, scheduledWeeks: [26] },
  { label: "JENERATÖR BAKIMI", company: "YAKAMOZ MAKİNA", yearlyCount: 3, machineNames: ["JENERATÖR-01", "JENERATÖR-02"], scheduledWeeks: [11, 28, 46] },
  { label: "ISITMA/SOĞUTMA VRF", company: "KARBUZ SOĞUTMA", yearlyCount: 2, machineNames: ["VRV İÇ ÜNİTE (22 adet)", "VRV DIŞ ÜNİTE-01", "VRV DIŞ ÜNİTE-02", "VRV DIŞ ÜNİTE-03", "VRV DIŞ ÜNİTE-04", "VRV DIŞ ÜNİTE-05", "VRV DIŞ ÜNİTE-06", "VRV DIŞ ÜNİTE-07", "VRV DIŞ ÜNİTE-08", "VRV DIŞ ÜNİTE-09", "VRV DIŞ ÜNİTE-10", "VRV DIŞ ÜNİTE-11", "VRV DIŞ ÜNİTE-12", "VRV DIŞ ÜNİTE-13", "VRV DIŞ ÜNİTE-14"], scheduledWeeks: [11, 37] },
  { label: "HAVALANDIRMA SANTRALLERİ VE ISI GERİ KAZANIM CİHAZI", company: "EMR KLİMA", yearlyCount: 2, scheduledWeeks: [11, 38] },
  { label: "OTOPARK JET FANLARI", company: "ATC", yearlyCount: 1, scheduledWeeks: [23] },
  { label: "ASANSÖR", company: "OTİS", yearlyCount: 12, machineNames: ["ASANSÖR-01", "ASANSÖR-02", "ASANSÖR-03", "ASANSÖR-04", "ASANSÖR-05", "ASANSÖR-06", "ASANSÖR-07", "ASANSÖR-08"], scheduledWeeks: [1, 6, 10, 14, 18, 23, 27, 32, 36, 40, 45, 49] },
  { label: "YANGIN SÖNDÜRME KOLLEKTÖR VE POMPALAR", company: "EMECH", yearlyCount: 2, machineNames: ["YANGIN POMPASI-01", "YANGIN POMPASI-02"], scheduledWeeks: [22, 48] },
  { label: "YANGIN TÜPLERİ VE DOLAPLARI", company: "ISS-HASSA", yearlyCount: 12, machineNames: ["YANGIN DOLAPLARI", "YANGIN TÜPLERİ"], scheduledWeeks: [3, 7, 11, 16, 21, 24, 29, 34, 38, 41, 42, 47, 51] },
  { label: "UPS", company: "ISS-ERK ENERJİ", yearlyCount: 12, machineNames: ["UPS"], scheduledWeeks: [1, 6, 10, 14, 18, 23, 27, 32, 36, 37, 40, 45, 49] },
  { label: "ZAYIF AKIM SİSTEMLERİ/YANGIN SİS.OTOMASYON", company: "İNTERTEC", yearlyCount: 1, machineNames: ["YANGIN KONTROL PANELİ-01", "YANGIN KONTROL PANELİ-02"], scheduledWeeks: [16] },
  { label: "MONORAY BAKIMI", company: "SAB MAKİNA", yearlyCount: 2, scheduledWeeks: [23] },
  { label: "DIŞ CEPHE SİLİMİ", company: "SAB MAKİNA", yearlyCount: 2, scheduledWeeks: [23] },
  { label: "SU DEPO TEMİZLİĞİ", company: "İSTTEM", yearlyCount: 1, machineNames: ["SU DEPOSU-1 A BLOK", "SU DEPOSU-1 B BLOK", "GRİ SU DEPOSU B1 KAT"], scheduledWeeks: [26] },
];

/** DLP No.1 Plaza 2026 "Periyodik (Fenni) Muayene" Excel'inden ("DLP 2026" sayfası, "FENNİ
 * MUAYENE" bölümü) birebir aktarılmış kalem listesi. */
export const INSPECTION_PLAN_ITEMS_DLP_2026: PlanItemSeed[] = [
  { label: "ASANSÖR KONTROLLERİ", company: "KENT", yearlyCount: 1, machineNames: ["ASANSÖR-01", "ASANSÖR-02", "ASANSÖR-03", "ASANSÖR-04", "ASANSÖR-05", "ASANSÖR-06", "ASANSÖR-07", "ASANSÖR-08"], scheduledWeeks: [41] },
  { label: "BASINÇLANDIRMA VE HAVALANDIRMA SİSTEMİ KONTROLÜ", company: "DETAM", yearlyCount: 1, scheduledWeeks: [23] },
  { label: "PARATONER-TOPRAKLAMA İÇ TESİSAT KONTROLÜ", company: "DETAM", yearlyCount: 1, scheduledWeeks: [23] },
  { label: "JENERATÖR KONTROLÜ", company: "DETAM", yearlyCount: 1, machineNames: ["JENERATÖR-01", "JENERATÖR-02"], scheduledWeeks: [23] },
  { label: "GENLEŞME TANKI VE HİDROFOR KONTROLÜ", company: "DETAM", yearlyCount: 1, machineNames: ["KULLANMA SUYU HİDRAFORU-01", "KULLANMA SUYU HİDRAFORU-02", "KULLANMA SUYU HİDRAFORU-03", "YAĞMUR SUYU HİDRAFORU-01", "YAĞMUR SUYU HİDRAFORU-02", "YAĞMUR SUYU HİDRAFORU-03"], scheduledWeeks: [23] },
  { label: "YANGIN POMPALARI PERFORMANS TESTİ", company: "DETAM", yearlyCount: 1, machineNames: ["YANGIN POMPASI-01", "YANGIN POMPASI-02"], scheduledWeeks: [23] },
  { label: "YANGIN SÖNDÜRME TESİSATI SİSTEMİ KONTROLÜ", company: "DETAM", yearlyCount: 1, scheduledWeeks: [23] },
  { label: "ASILI ERİŞİM DONANIMI KONTROLÜ", company: "DETAM", yearlyCount: 1, scheduledWeeks: [23] },
];

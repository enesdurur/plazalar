/** Link Plaza 2026 "Yıllık Bakım Planı" Excel'inden (Periyodik_Muayeneler.xlsx, "BAKIM"
 * sütunu) birebir aktarılmış kalem listesi. machineName doluysa, mevcut Machine kaydıyla
 * (tekil ve net eşleşen durumlarda) ilişkilendirilir — seed.ts bu isimle Machine'i bulur. */
export interface PlanItemSeed {
  label: string;
  company: string;
  yearlyCount: number;
  machineName?: string;
}

export const MAINTENANCE_PLAN_ITEMS_2026: PlanItemSeed[] = [
  { label: "TRAFO İŞLETME SORUMLULUĞU", company: "VALANS MÜHENDİSLİK", yearlyCount: 12, machineName: "TRAFO-01" },
  { label: "TRAFO KESİCİ VE O.G. HÜCRE BAKIMI", company: "VALANS MÜHENDİSLİK", yearlyCount: 1, machineName: "KESİCİ-01" },
  { label: "JENERATÖR BAKIMI", company: "YAKAMOZ MAKİNA", yearlyCount: 3 },
  { label: "CHİLLER GRUPLARI", company: "BİRSO SOĞUTMA", yearlyCount: 1 },
  { label: "HAVALANDIRMA SANTRALLERİ VE ISI GERİ KAZANIM CİHAZI", company: "EMR KLİMA", yearlyCount: 2 },
  { label: "ISITMA KAZANLARI", company: "VİESSMANN", yearlyCount: 1 },
  { label: "OTOPARK JET FANLARI", company: "ATC", yearlyCount: 1 },
  { label: "ASANSÖR", company: "OTİS", yearlyCount: 12 },
  { label: "YANGIN SÖNDÜRME KOLLEKTÖR VE POMPALAR", company: "EMECH", yearlyCount: 2 },
  { label: "SU KİMYASALLARI ANALİZİ (MEKANİK TESİSAT)", company: "OMC", yearlyCount: 12 },
  { label: "YANGIN TÜPLERİ VE DOLAPLARI", company: "ISS-HASSA", yearlyCount: 12, machineName: "YANGIN DOLABI" },
  { label: "UPS", company: "ISS-ERK ENERJİ", yearlyCount: 12, machineName: "UPS-01" },
  { label: "MEKANİK OTOMASYON", company: "TMS", yearlyCount: 1 },
  { label: "ZAYIF AKIM SİSTEMLERİ / YANGIN SİS. OTOMASYON", company: "İNTERTEC", yearlyCount: 1, machineName: "YANGIN İHBAR PANELİ" },
  { label: "DIŞ CEPHE ASANSÖR BAKIMI", company: "SAB MAKİNA", yearlyCount: 2, machineName: "DIŞ CEPHE ASANSÖRÜ" },
  { label: "DIŞ CEPHE SİLİMİ", company: "SAB MAKİNA", yearlyCount: 2 },
  { label: "SU DEPOLARI TEMİZLİĞİ", company: "İSTTEM", yearlyCount: 1 },
];

/** Link Plaza 2026 "Periyodik (Fenni) Muayene" Excel'inden (Fenni_Muayeneler.xlsx, "FENNİ
 * MUAYENE" sütunu) birebir aktarılmış kalem listesi. */
export const INSPECTION_PLAN_ITEMS_2026: PlanItemSeed[] = [
  { label: "ASANSÖR KONTROLLERİ", company: "D-KARE", yearlyCount: 1 },
  { label: "BASINÇLANDIRMA VE HAVALANDIRMA SİSTEMİ KONTROLÜ", company: "DETAM", yearlyCount: 1 },
  { label: "PARATONER-TOPRAKLAMA İÇ TESİSAT KONTROLÜ", company: "DETAM", yearlyCount: 1 },
  { label: "KAZAN VE JENERATÖR KONTROLÜ", company: "DETAM", yearlyCount: 1 },
  { label: "GENLEŞME TANKI VE HİDROFOR KONTROLÜ", company: "DETAM", yearlyCount: 1 },
  { label: "YANGIN POMPALARI PERFORMANS TESTİ", company: "DETAM", yearlyCount: 1 },
  { label: "YANGIN SÖNDÜRME TESİSATI SİSTEMİ KONTROLÜ", company: "DETAM", yearlyCount: 1 },
  { label: "ASILI ERİŞİM DONANIMI KONTROLÜ", company: "DETAM", yearlyCount: 1, machineName: "DIŞ CEPHE ASANSÖRÜ" },
];

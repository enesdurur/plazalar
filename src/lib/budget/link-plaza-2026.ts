// Link Plaza 2026 gerçekleşen bütçe verileri.
// Kaynak: kullanıcı tarafından sağlanan Excel tabloları (LİNK PLAZA GERÇEKLEŞEN BÜTÇE).
// E/F/G (aylık gerçekleşen), K (aylık taslak bütçe) ve fill (Excel'deki satır rengi) sütunlarının
// birebir kopyasıdır; türetilen sütunlar computeLinkPlazaBudget() ile hesaplanır.

export interface BudgetLineItem {
  category?: string | null;
  label: string;
  /** Aylık gerçekleşen tutarlar (3 ay) */
  months: [number, number, number];
  /** Aylık taslak bütçe (K sütunu) */
  monthlyBudget: number;
  /** Excel kaynak satırının arka plan rengi (hex) */
  fill: string | null;
}

export interface BudgetQuarterData {
  key: "q1" | "q2";
  title: string;
  monthNames: [string, string, string];
  personnelRows: BudgetLineItem[];
  managementRows: BudgetLineItem[];
  otherRows: BudgetLineItem[];
  fxLabels: [string, string, string];
  fxRates: [number, number, number];
}

export const LINK_PLAZA_BUDGET_2026: BudgetQuarterData[] = [
  {
    key: "q1",
    title: "OCAK - ŞUBAT - MART",
    monthNames: ["OCAK", "ŞUBAT", "MART"],
    personnelRows: [
      { category: "YÖNETİM", label: "2/3 Tesis Yöneticisi", months: [177000.0, 177000.0, 177000.0], monthlyBudget: 177000.0, fill: "#B4C7E7" },
      { category: null, label: "1/2 STPU (Servis Takip Planlama Uzmanı)", months: [110000.0, 110000.0, 110000.0], monthlyBudget: 110000.0, fill: "#B4C7E7" },
      { category: "TEKNİK", label: "1/2 Teknik Hizmet Sorumlusu", months: [112000.0, 112000.0, 112000.0], monthlyBudget: 112000.0, fill: "#B4C7E7" },
      { category: "GÜVENLİK", label: "8 Güvenlik Personeli", months: [858797.35, 862943.61, 867089.87], monthlyBudget: 858797.3529708962, fill: "#C6DEB5" },
      { category: "TEKNİK", label: "2 Teknik Personeli", months: [284094.47, 284793.24, 285492.03], monthlyBudget: 284094.4618328524, fill: "#C6DEB5" },
      { category: "TEMİZLİK", label: "3 full time Temizlik Personeli", months: [243296.49, 244414.54, 245532.58], monthlyBudget: 243296.49265439116, fill: "#C6DEB5" },
      { category: "BAHÇE", label: "1 Bahçıvan", months: [68199.68, 68381.18, 68562.68], monthlyBudget: 68199.68, fill: "#C6DEB5" },
      { category: "İŞ SAĞLIĞI VE GÜVENLİĞİ", label: "1/4 İsg Uzmanı", months: [31833.0, 32926.02, 32379.51], monthlyBudget: 31833.0, fill: "#C6DEB5" },
      { category: null, label: "1 Vale", months: [81650.0, 81650.0, 81650.0], monthlyBudget: 81650.0, fill: "#C6DEB5" },
    ],
    managementRows: [
      { label: "Sigorta Giderleri", months: [190501.88, 190501.88, 190501.88], monthlyBudget: 200000.0, fill: "#B4C7E7" },
      { label: "MALi Müşavirlik  Giderleri", months: [10267.0, 10267.0, 10267.0], monthlyBudget: 10267.0, fill: "#B4C7E7" },
      { label: "Hukuki Giderleri", months: [15733.0, 15733.0, 15733.0], monthlyBudget: 15733.0, fill: "#B4C7E7" },
      { label: "Büro  Hizmetleri Giderleri", months: [24500.0, 24500.0, 24500.0], monthlyBudget: 24500.0, fill: "#B4C7E7" },
      { label: "Muhasebe Hizmetleri", months: [24500.0, 24500.0, 24500.0], monthlyBudget: 24500.0, fill: "#B4C7E7" },
    ],
    otherRows: [
      { label: "Ortak Alan Elektrik", months: [245698.35, 174165.27, 154267.69], monthlyBudget: 270876.94, fill: null },
      { label: "Ortak Alan Su Kullanımı", months: [6645.97, 4501.65, 22304.59], monthlyBudget: 33420.47, fill: null },
      { label: "Peyzaj Giderleri", months: [0.0, 0.0, 0.0], monthlyBudget: 4315.15, fill: null },
      { label: "İlaçlama Hizmetleri", months: [0.0, 3000.0, 3000.0], monthlyBudget: 3000.0, fill: null },
      { label: "Mekanik/Elektrik ve Diğer Sarf Malzemeler/Yedek Parçalar", months: [159689.95, 34042.24, 144332.15], monthlyBudget: 150000.0, fill: null },
      { label: "3.Firma Bakım Anlaşmaları", months: [45322.0, 79572.0, 66952.0], monthlyBudget: 90257.33, fill: null },
      { label: "Dış Cephe Temizliği", months: [0.0, 0.0, 0.0], monthlyBudget: 18333.33, fill: null },
      { label: "Fenni Muayeneler", months: [0.0, 0.0, 0.0], monthlyBudget: 2310.64, fill: null },
      { label: "Wc sarf malzeme giderleri", months: [0.0, 4116.15, 3494.07], monthlyBudget: 3548.46, fill: null },
      { label: "Öngörülmeyen Giderler", months: [0.0, 0.0, 0.0], monthlyBudget: 54405.0, fill: null },
      { label: "Diğer Giderler", months: [5256.98, 4212.41, 10765.42], monthlyBudget: 36315.9, fill: null },
    ],
    fxLabels: ["01.2026 USD", "02.2026 USD", "03.2026 USD"],
    fxRates: [42.88, 43.4168, 43.885],
  },
  {
    key: "q2",
    title: "NİSAN - MAYIS - HAZİRAN",
    monthNames: ["NİSAN", "MAYIS", "HAZİRAN"],
    personnelRows: [
      { category: "YÖNETİM", label: "2/3 Tesis Yöneticisi", months: [177000.0, 177000.0, 177000.0], monthlyBudget: 177000.0, fill: "#B4C7E7" },
      { category: null, label: "1/2 STPU (Servis Takip Planlama Uzmanı)", months: [110000.0, 110000.0, 110000.0], monthlyBudget: 110000.0, fill: "#B4C7E7" },
      { category: "TEKNİK", label: "1/2 Teknik Hizmet Sorumlusu", months: [112000.0, 112000.0, 112000.0], monthlyBudget: 112000.0, fill: "#B4C7E7" },
      { category: "GÜVENLİK", label: "8 Güvenlik Personeli", months: [867089.87, 867089.87, 867089.87], monthlyBudget: 858797.3529708962, fill: "#C6DEB5" },
      { category: "TEKNİK", label: "2 Teknik Personeli", months: [285492.01, 285492.03, 285492.03], monthlyBudget: 284094.4618328524, fill: "#C6DEB5" },
      { category: "TEMİZLİK", label: "3 full time Temizlik Personeli", months: [245532.58, 245532.58, 220325.56], monthlyBudget: 243296.49265439116, fill: "#C6DEB5" },
      { category: "BAHÇE", label: "1 Bahçıvan", months: [0.0, 137125.36, 68562.68], monthlyBudget: 68199.68, fill: "#C6DEB5" },
      { category: "İŞ SAĞLIĞI VE GÜVENLİĞİ", label: "1/4 İsg Uzmanı", months: [32379.51, 32379.51, 32379.51], monthlyBudget: 31833.0, fill: "#C6DEB5" },
      { category: null, label: "1 Vale", months: [81650.0, 81650.0, 81650.0], monthlyBudget: 81650.0, fill: "#C6DEB5" },
    ],
    managementRows: [
      { label: "Sigorta Giderleri", months: [190501.88, 190501.88, 190501.88], monthlyBudget: 200000.0, fill: "#B4C7E7" },
      { label: "MALi Müşavirlik  Giderleri", months: [10267.0, 10267.0, 10267.0], monthlyBudget: 10267.0, fill: "#B4C7E7" },
      { label: "Hukuki Giderleri", months: [15733.0, 15733.0, 15733.0], monthlyBudget: 15733.0, fill: "#B4C7E7" },
      { label: "Büro  Hizmetleri Giderleri", months: [24500.0, 24500.0, 24500.0], monthlyBudget: 24500.0, fill: "#B4C7E7" },
      { label: "Muhasebe Hizmetleri", months: [24500.0, 24500.0, 24500.0], monthlyBudget: 24500.0, fill: "#B4C7E7" },
    ],
    otherRows: [
      { label: "Ortak Alan Elektrik", months: [175924.82, 151864.25, 153362.56], monthlyBudget: 270876.94, fill: null },
      { label: "Ortak Alan Su Kullanımı", months: [55381.33, 28036.76, 44577.54], monthlyBudget: 33420.47, fill: null },
      { label: "Peyzaj Giderleri", months: [0.0, 12000.0, 56240.78], monthlyBudget: 4315.15, fill: null },
      { label: "İlaçlama Hizmetleri", months: [3000.0, 3000.0, 3000.0], monthlyBudget: 3000.0, fill: null },
      { label: "Mekanik/Elektrik ve Diğer Sarf Malzemeler/Yedek Parçalar", months: [203697.73, 770697.04, 154746.7], monthlyBudget: 150000.0, fill: null },
      { label: "3.Firma Bakım Anlaşmaları", months: [104472.0, 63572.0, 77072.0], monthlyBudget: 90257.33, fill: null },
      { label: "Dış Cephe Temizliği", months: [0.0, 0.0, 220000.0], monthlyBudget: 18333.33, fill: null },
      { label: "Fenni Muayeneler", months: [0.0, 0.0, 0.0], monthlyBudget: 2310.64, fill: null },
      { label: "Wc sarf malzeme giderleri", months: [3727.35, 4141.5, 3727.35], monthlyBudget: 3548.46, fill: null },
      { label: "Öngörülmeyen Giderler", months: [0.0, 0.0, 0.0], monthlyBudget: 54405.0, fill: null },
      { label: "Diğer Giderler", months: [10605.47, 7528.66, 8339.76], monthlyBudget: 36315.9, fill: null },
    ],
    fxLabels: ["04.2026 USD", "05.2026 USD", "06.2026 USD"],
    fxRates: [44.3938, 45.104, 45.8248],
  },
];

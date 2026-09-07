// DLP No.1 Plaza 2026 gerçekleşen bütçe verileri.
// Kaynak: kullanıcı tarafından sağlanan Excel tabloları (DLP PLAZA GERÇEKLEŞEN BÜTÇE).
// E/F/G (aylık gerçekleşen), K (aylık taslak bütçe) ve fill (Excel'deki satır rengi) sütunlarının
// birebir kopyasıdır; türetilen sütunlar computeLinkPlazaBudget() ile hesaplanır. "YÖNETİM KARI"
// Excel'de gerçek/sabit bir kalem olarak veriliyor (7 formülüyle sonradan türetilmiyor).

import type { BudgetQuarterData } from "./link-plaza-2026";

export const DLP_PLAZA_BUDGET_2026: BudgetQuarterData[] = [
  {
    key: "q1",
    title: "OCAK - ŞUBAT - MART",
    monthNames: ["OCAK", "ŞUBAT", "MART"],
    personnelRows: [
      { category: "YÖNETİM", label: "2/3 Tesis Yöneticisi", months: [88000, 88000, 88000], monthlyBudget: 88000, fill: null },
      { category: null, label: "1/2 STPU (Servis Takip Planlama Uzmanı)", months: [55000, 55000, 55000], monthlyBudget: 55000, fill: null },
      { category: "TEKNİK", label: "1/2 Teknik Hizmet Sorumlusu", months: [55000, 55000, 55000], monthlyBudget: 55000, fill: "#B4C7E7" },
      { category: "GÜVENLİK", label: "8 Güvenlik Personeli", months: [848059.02, 852226.68, 856394.32], monthlyBudget: 848059.02, fill: "#C6DEB5" },
      { category: "TEKNİK", label: "2 Teknik Personeli", months: [123653.39, 123655.37, 129801.95], monthlyBudget: 123282.81, fill: "#C6DEB5" },
      { category: "TEMİZLİK", label: "3 full time Temizlik Personeli", months: [163711.28, 164456.64, 165202], monthlyBudget: 163711.28, fill: "#C6DEB5" },
      { category: "BAHÇE", label: "1 Bahçıvan", months: [34099.84, 34190.59, 34281.34], monthlyBudget: 34099.84, fill: "#C6DEB5" },
      { category: "İŞ SAĞLIĞI VE GÜVENLİĞİ", label: "1/4 İsg Uzmanı", months: [31833, 32926.02, 32379.51], monthlyBudget: 31883, fill: "#C6DEB5" },
    ],
    managementRows: [
      { category: null, label: "Sigorta Giderleri", months: [0, 0, 0], monthlyBudget: 0, fill: "#B4C7E7" },
      { category: null, label: "MALi Müşavirlik Giderleri", months: [10267, 10267, 10267], monthlyBudget: 10267, fill: "#B4C7E7" },
      { category: null, label: "Hukuki Giderleri", months: [15733, 15733, 15733], monthlyBudget: 15733, fill: "#B4C7E7" },
      { category: null, label: "Büro Hizmetleri Giderleri", months: [21250, 21250, 21250], monthlyBudget: 21250, fill: "#B4C7E7" },
      { category: null, label: "Muhasebe Hizmetleri", months: [21250, 21250, 21250], monthlyBudget: 21250, fill: "#B4C7E7" },
      { category: null, label: "YÖNETİM KARI", months: [97932.52, 97932.52, 97932.52], monthlyBudget: 97932.52, fill: null },
    ],
    otherRows: [
      { category: null, label: "Ortak Alan Elektrik", months: [290387.96, 237577.1, 187576.2], monthlyBudget: 227591.71, fill: null },
      { category: null, label: "Ortak Alan Su Kullanımı", months: [28166.23, 27419.78, 32692.04], monthlyBudget: 45832.91, fill: null },
      { category: null, label: "Peyzaj Giderleri", months: [0, 0, 0], monthlyBudget: 793.98, fill: null },
      { category: null, label: "İlaçlama Hizmetleri", months: [0, 3000, 3000], monthlyBudget: 3000, fill: null },
      { category: null, label: "Mekanik/Elektrik ve Diğer Sarf Malzemeler/Yedek Parçalar", months: [53640.99, 47842.39, 44723.63], monthlyBudget: 168318.52, fill: null },
      { category: null, label: "3.Firma Bakım Anlaşmaları", months: [36931, 64931, 54311], monthlyBudget: 81060.67, fill: null },
      { category: null, label: "Dış Cephe Temizliği", months: [0, 0, 0], monthlyBudget: 18750, fill: null },
      { category: null, label: "Fenni Muayeneler", months: [0, 0, 0], monthlyBudget: 2241.36, fill: null },
      { category: null, label: "Wc sarf malzeme giderleri", months: [8190.1, 8337.79, 3608.33], monthlyBudget: 6417.02, fill: null },
      { category: null, label: "Öngörülmeyen Giderler", months: [0, 0, 0], monthlyBudget: 67500, fill: null },
      { category: null, label: "Diğer Giderler", months: [3697.95, 8604.86, 6040.43], monthlyBudget: 18909.8, fill: null },
    ],
    fxLabels: ["01.2026 USD", "02.2026 USD", "03.2026 USD"],
    fxRates: [42.881, 43.4168, 43.885],
  },
  {
    key: "q2",
    title: "NİSAN - MAYIS - HAZİRAN",
    monthNames: ["NİSAN", "MAYIS", "HAZİRAN"],
    personnelRows: [
      { category: "YÖNETİM", label: "2/3 Tesis Yöneticisi", months: [88000, 88000, 88000], monthlyBudget: 88000, fill: null },
      { category: null, label: "1/2 STPU (Servis Takip Planlama Uzmanı)", months: [55000, 55000, 55000], monthlyBudget: 55000, fill: null },
      { category: "TEKNİK", label: "1/2 Teknik Hizmet Sorumlusu", months: [55000, 55000, 55000], monthlyBudget: 55000, fill: "#B4C7E7" },
      { category: "GÜVENLİK", label: "8 Güvenlik Personeli", months: [856394.32, 856394.32, 856394.32], monthlyBudget: 848059.02, fill: "#C6DEB5" },
      { category: "TEKNİK", label: "2 Teknik Personeli", months: [129801.95, 1772.97, 39252.7], monthlyBudget: 123282.81, fill: "#C6DEB5" },
      { category: "TEMİZLİK", label: "3 full time Temizlik Personeli", months: [165202, 165202, 165202], monthlyBudget: 163711.28, fill: "#C6DEB5" },
      { category: "BAHÇE", label: "1 Bahçıvan", months: [0, 68562.68, 34281.34], monthlyBudget: 34099.84, fill: "#C6DEB5" },
      { category: "İŞ SAĞLIĞI VE GÜVENLİĞİ", label: "1/4 İsg Uzmanı", months: [32379.51, 32379.51, 32379.51], monthlyBudget: 31883, fill: "#C6DEB5" },
    ],
    managementRows: [
      { category: null, label: "Sigorta Giderleri", months: [0, 0, 0], monthlyBudget: 0, fill: "#B4C7E7" },
      { category: null, label: "MALi Müşavirlik Giderleri", months: [10267, 10267, 10267], monthlyBudget: 10267, fill: "#B4C7E7" },
      { category: null, label: "Hukuki Giderleri", months: [15733, 15733, 15733], monthlyBudget: 15733, fill: "#B4C7E7" },
      { category: null, label: "Büro Hizmetleri Giderleri", months: [21250, 21250, 21250], monthlyBudget: 21250, fill: "#B4C7E7" },
      { category: null, label: "Muhasebe Hizmetleri", months: [21250, 21250, 21250], monthlyBudget: 21250, fill: "#B4C7E7" },
      { category: null, label: "YÖNETİM KARI", months: [97932.52, 97932.52, 97932.52], monthlyBudget: 97932.52, fill: null },
    ],
    otherRows: [
      { category: null, label: "Ortak Alan Elektrik", months: [192635.57, 135433.78, 120122.29], monthlyBudget: 227591.71, fill: null },
      { category: null, label: "Ortak Alan Su Kullanımı", months: [36617.07, 57988.35, 61878.16], monthlyBudget: 45832.91, fill: null },
      { category: null, label: "Peyzaj Giderleri", months: [0, 5000, 752.63], monthlyBudget: 793.98, fill: null },
      { category: null, label: "İlaçlama Hizmetleri", months: [3000, 3000, 3000], monthlyBudget: 3000, fill: null },
      { category: null, label: "Mekanik/Elektrik ve Diğer Sarf Malzemeler/Yedek Parçalar", months: [32458.11, 45331, 322795.06], monthlyBudget: 168318.52, fill: null },
      { category: null, label: "3.Firma Bakım Anlaşmaları", months: [147331, 76931, 64431], monthlyBudget: 81060.67, fill: null },
      { category: null, label: "Dış Cephe Temizliği", months: [0, 0, 0], monthlyBudget: 18750, fill: null },
      { category: null, label: "Fenni Muayeneler", months: [0, 0, 0], monthlyBudget: 2241.36, fill: null },
      { category: null, label: "Wc sarf malzeme giderleri", months: [3608.33, 3608.33, 3608.33], monthlyBudget: 6417.02, fill: null },
      { category: null, label: "Öngörülmeyen Giderler", months: [0, 0, 0], monthlyBudget: 67500, fill: null },
      { category: null, label: "Diğer Giderler", months: [7742.76, 3235.91, 3236.16], monthlyBudget: 18909.8, fill: null },
    ],
    fxLabels: ["01.2026 USD", "02.2026 USD", "03.2026 USD"],
    fxRates: [44.3938, 45.104, 45.8248],
  },
];

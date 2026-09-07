// Olive Plaza 2026 gerçekleşen bütçe verileri.
// Kaynak: kullanıcı tarafından sağlanan Excel tabloları (OLİVE PLAZA GERÇEKLEŞEN BÜTÇE).
// E/F/G (aylık gerçekleşen), K (aylık taslak bütçe) ve fill (Excel'deki satır rengi) sütunlarının
// birebir kopyasıdır; türetilen sütunlar computeLinkPlazaBudget() ile hesaplanır.

import type { BudgetQuarterData } from "./link-plaza-2026";

export const OLIVE_PLAZA_BUDGET_2026: BudgetQuarterData[] = [
  {
    key: "q1",
    title: "OCAK - ŞUBAT - MART",
    monthNames: ["OCAK", "ŞUBAT", "MART"],
    personnelRows: [
      { category: "YÖNETİM", label: "2/3 Tesis Yöneticisi", months: [88000, 88000, 88000], monthlyBudget: 88000, fill: null },
      { category: null, label: "1/2 STPU (Servis Takip Planlama Uzmanı)", months: [55000, 55000, 55000], monthlyBudget: 55000, fill: null },
      { category: "TEKNİK", label: "1/2 Teknik Hizmet Sorumlusu", months: [55000, 55000, 55000], monthlyBudget: 55000, fill: "#B4C7E7" },
      { category: "GÜVENLİK", label: "8 Güvenlik Personeli", months: [833452.48, 837619.72, 841786.94], monthlyBudget: 833452.4897865221, fill: "#C6DEB5" },
      { category: "TEKNİK", label: "2 Teknik Personeli", months: [127489.92, 127839.31, 128188.69], monthlyBudget: 127489.9169495824, fill: "#C6DEB5" },
      { category: "TEMİZLİK", label: "3 full time Temizlik Personeli", months: [162562.17, 163307.54, 164052.9], monthlyBudget: 162562.1746906824, fill: "#C6DEB5" },
      { category: "BAHÇE", label: "1 Bahçıvan", months: [11366.61, 11396.66, 11427.11], monthlyBudget: 11366.61, fill: "#C6DEB5" },
      { category: "İŞ SAĞLIĞI VE GÜVENLİĞİ", label: "1/4 İsg Uzmanı", months: [31833, 32926.02, 32379.51], monthlyBudget: 31883, fill: "#C6DEB5" },
    ],
    managementRows: [
      { category: null, label: "Sigorta Giderleri", months: [96114.69, 96114.69, 96114.69], monthlyBudget: 100000, fill: "#B4C7E7" },
      { category: null, label: "MALi Müşavirlik Giderleri", months: [10267, 10267, 10267], monthlyBudget: 10267, fill: "#B4C7E7" },
      { category: null, label: "Hukuki Giderleri", months: [15733, 15733, 15733], monthlyBudget: 15733, fill: "#B4C7E7" },
      { category: null, label: "Büro Hizmetleri Giderleri", months: [19500, 19500, 19500], monthlyBudget: 19500, fill: "#B4C7E7" },
      { category: null, label: "Muhasebe Hizmetleri", months: [19500, 19500, 19500], monthlyBudget: 19500, fill: "#B4C7E7" },
      { category: null, label: "YÖNETİM KARI", months: [81885.25, 81885.25, 81885.25], monthlyBudget: 81885.25, fill: null },
    ],
    otherRows: [
      { category: null, label: "Ortak Alan Elektrik", months: [132597.66, 99763.05, 50097.88], monthlyBudget: 139702.2, fill: null },
      { category: null, label: "Ortak Alan Su Kullanımı", months: [1342.23, 1784.5, 5974.4], monthlyBudget: 16121.23, fill: null },
      { category: null, label: "Peyzaj Giderleri", months: [0, 0, 0], monthlyBudget: 971.87, fill: null },
      { category: null, label: "İlaçlama Hizmetleri", months: [0, 3000, 3000], monthlyBudget: 3000, fill: null },
      { category: null, label: "Mekanik/Elektrik ve Diğer Sarf Malzemeler/Yedek Parçalar", months: [26843.28, 93976.03, 773402.96], monthlyBudget: 137948.28, fill: null },
      { category: null, label: "3.Firma Bakım Anlaşmaları", months: [41846, 44096, 47476], monthlyBudget: 85216.93, fill: null },
      { category: null, label: "Dış Cephe Temizliği", months: [0, 0, 0], monthlyBudget: 6250, fill: null },
      { category: null, label: "Fenni Muayeneler", months: [0, 0, 0], monthlyBudget: 2053.24, fill: null },
      { category: null, label: "Wc sarf malzeme giderleri", months: [3708, 3883.73, 3883.73], monthlyBudget: 4387.13, fill: null },
      { category: null, label: "Öngörülmeyen Giderler", months: [0, 0, 0], monthlyBudget: 11700, fill: null },
      { category: null, label: "Diğer Giderler", months: [4880.24, 5889.95, 8044.02], monthlyBudget: 20146.02, fill: null },
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
      { category: "GÜVENLİK", label: "8 Güvenlik Personeli", months: [841786.94, 841786.94, 841786.94], monthlyBudget: 833452.4897865221, fill: "#C6DEB5" },
      { category: "TEKNİK", label: "2 Teknik Personeli", months: [128188.69, 128188.69, 128188.69], monthlyBudget: 127489.9169495824, fill: "#C6DEB5" },
      { category: "TEMİZLİK", label: "3 full time Temizlik Personeli", months: [164052.9, 164052.9, 164052.9], monthlyBudget: 162562.1746906824, fill: "#C6DEB5" },
      { category: "BAHÇE", label: "1 Bahçıvan", months: [0, 22854.22, 11427.11], monthlyBudget: 11366.61, fill: "#C6DEB5" },
      { category: "İŞ SAĞLIĞI VE GÜVENLİĞİ", label: "1/4 İsg Uzmanı", months: [32379.51, 32379.51, 32379.51], monthlyBudget: 31883, fill: "#C6DEB5" },
    ],
    managementRows: [
      { category: null, label: "Sigorta Giderleri", months: [96114.69, 96114.69, 96114.69], monthlyBudget: 100000, fill: "#B4C7E7" },
      { category: null, label: "MALi Müşavirlik Giderleri", months: [10267, 10267, 10267], monthlyBudget: 10267, fill: "#B4C7E7" },
      { category: null, label: "Hukuki Giderleri", months: [15733, 15733, 15733], monthlyBudget: 15733, fill: "#B4C7E7" },
      { category: null, label: "Büro Hizmetleri Giderleri", months: [19500, 19500, 19500], monthlyBudget: 19500, fill: "#B4C7E7" },
      { category: null, label: "Muhasebe Hizmetleri", months: [19500, 19500, 19500], monthlyBudget: 19500, fill: "#B4C7E7" },
      { category: null, label: "YÖNETİM KARI", months: [81885.25, 81885.25, 81885.25], monthlyBudget: 81885.25, fill: null },
    ],
    otherRows: [
      { category: null, label: "Ortak Alan Elektrik", months: [99184.07, 84064.42, 71369.63], monthlyBudget: 139702.2, fill: null },
      { category: null, label: "Ortak Alan Su Kullanımı", months: [2886.79, 2852.94, 16500.53], monthlyBudget: 16121.23, fill: null },
      { category: null, label: "Peyzaj Giderleri", months: [0, 5000, 3821.33], monthlyBudget: 971.87, fill: null },
      { category: null, label: "İlaçlama Hizmetleri", months: [3000, 3000, 3000], monthlyBudget: 3000, fill: null },
      { category: null, label: "Mekanik/Elektrik ve Diğer Sarf Malzemeler/Yedek Parçalar", months: [20589.22, 38563.06, 314474.59], monthlyBudget: 137948.28, fill: null },
      { category: null, label: "3.Firma Bakım Anlaşmaları", months: [101096, 44096, 57596], monthlyBudget: 85216.93, fill: null },
      { category: null, label: "Dış Cephe Temizliği", months: [0, 0, 75000], monthlyBudget: 6250, fill: null },
      { category: null, label: "Fenni Muayeneler", months: [0, 0, 0], monthlyBudget: 2053.24, fill: null },
      { category: null, label: "Wc sarf malzeme giderleri", months: [6128.33, 3883.73, 3883.73], monthlyBudget: 4387.13, fill: null },
      { category: null, label: "Öngörülmeyen Giderler", months: [0, 0, 0], monthlyBudget: 11700, fill: null },
      { category: null, label: "Diğer Giderler", months: [5476.78, 7022.45, 5476.78], monthlyBudget: 20146.02, fill: null },
    ],
    fxLabels: ["04.2026 USD", "05.2026 USD", "06.2026 USD"],
    fxRates: [44.3938, 45.104, 45.8248],
  },
];

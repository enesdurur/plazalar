export const LINK_PLAZA_DISPLAY_TITLE = "MASLAK LİNK PLAZA";

/** Maslak Link Plaza'nın "Maslak_Link_Kat_Alanlar_.xlsx" dosyasındaki bina şeması görselini
 * birebir yansıtmak için: hangi katın rengi ne (Excel'de elle vurgulanmış, hesaplanabilir bir
 * kural değil — sadece bu binaya özgü referans) ve kiracı takibi yapılmayan ama alanı bilinen
 * bodrum katları (1.B-4.B; gerçek "Tenant" kaydı değiller, sadece görselde yer tutuyorlar). */
export const LINK_PLAZA_FLOOR_COLORS: Record<string, "orange" | "green"> = {
  "14 Asma": "orange",
  "14.KAT": "orange",
  "13.KAT": "green",
  "12.KAT": "green",
  "11.KAT": "green",
  "10.KAT": "green",
  "9.KAT": "green",
  "8.KAT": "green",
  "7.KAT": "green",
  "6.KAT": "green",
  "5.KAT": "green",
  "4.KAT": "green",
  "3.KAT": "green",
  "2.KAT": "orange",
  "1.KAT": "orange",
  "ZEMİN ASMA KAT": "orange",
  "Lobi Kat Kafe": "orange",
  "ZEMİN KAT": "orange",
};

export const LINK_PLAZA_BASEMENT_FLOORS: { floor: string; areaSqm: number }[] = [
  { floor: "1.B", areaSqm: 2174.35 },
  { floor: "2.B", areaSqm: 2174.35 },
  { floor: "3.B", areaSqm: 2174.35 },
  { floor: "4.B", areaSqm: 2174.35 },
];

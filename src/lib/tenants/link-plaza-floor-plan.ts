// Kaynak: Maslak_Link_Kat_Alanlar_.xlsx, "Link Plaza" sayfası, hücre B2.
export const LINK_PLAZA_DISPLAY_TITLE = "MASLAK LINK PLAZA";

/** Excel'deki asıl kat adı farklıysa (kısaltma/format farkı), Görsel sekmesinde gösterilecek
 * gerçek etiket. Tenant.floor (veritabanı anahtarı) değişmiyor, sadece bu görselde metin
 * değişiyor. */
export const LINK_PLAZA_FLOOR_DISPLAY_LABELS: Record<string, string> = {
  "ZEMİN ASMA KAT": "Asma Kat",
  "ZEMİN KAT": "Lobi Katı Ofis",
};

export interface FloorBarSegment {
  startPct: number;
  endPct: number;
  color: "orange" | "green" | null;
}

/** Maslak Link Plaza'nın "Maslak_Link_Kat_Alanlar_.xlsx" dosyasındaki bina şeması görselini
 * birebir yansıtmak için, gerçek Excel dosyasından çıkarılan hücre birleştirme (merge)
 * aralıkları ve dolgu renkleri (turuncu FFCC99, yeşil C6EFCE) — E:S sütun aralığının
 * yüzdesi olarak. Bar genişliği katın alanıyla orantılı DEĞİL, doğrudan Excel'deki hücre
 * genişliklerinden birebir alınmıştır. */
export const LINK_PLAZA_FLOOR_BAR_SEGMENTS: Record<string, FloorBarSegment[]> = {
  "14 Asma": [
    { startPct: 16.84, endPct: 29.56, color: null },
    { startPct: 29.56, endPct: 90.24, color: "orange" },
  ],
  "14.KAT": [{ startPct: 16.84, endPct: 90.24, color: "orange" }],
  "13.KAT": [{ startPct: 16.84, endPct: 90.24, color: "green" }],
  "12.KAT": [{ startPct: 16.84, endPct: 90.24, color: "green" }],
  "11.KAT": [{ startPct: 16.84, endPct: 90.24, color: "green" }],
  "10.KAT": [{ startPct: 16.84, endPct: 90.24, color: "green" }],
  "9.KAT": [{ startPct: 16.84, endPct: 90.24, color: "green" }],
  "8.KAT": [{ startPct: 16.84, endPct: 90.24, color: "green" }],
  "7.KAT": [{ startPct: 16.84, endPct: 90.24, color: "green" }],
  "6.KAT": [{ startPct: 16.84, endPct: 90.24, color: "green" }],
  "5.KAT": [{ startPct: 16.84, endPct: 90.24, color: "green" }],
  "4.KAT": [{ startPct: 16.84, endPct: 90.24, color: "green" }],
  "3.KAT": [{ startPct: 16.84, endPct: 90.24, color: "green" }],
  "2.KAT": [{ startPct: 16.84, endPct: 90.24, color: "orange" }],
  "1.KAT": [{ startPct: 16.84, endPct: 75.07, color: "orange" }],
  "ZEMİN ASMA KAT": [{ startPct: 16.84, endPct: 75.07, color: "orange" }],
  "Lobi Kat Kafe": [{ startPct: 0, endPct: 75.07, color: "orange" }],
  "ZEMİN KAT": [{ startPct: 0, endPct: 75.07, color: "orange" }],
};

const BASEMENT_SEGMENTS: FloorBarSegment[] = [{ startPct: 0, endPct: 100, color: null }];

export const LINK_PLAZA_BASEMENT_FLOORS: {
  floor: string;
  areaSqm: number;
  segments: FloorBarSegment[];
}[] = [
  { floor: "1.B", areaSqm: 2174.35 },
  { floor: "2.B", areaSqm: 2174.35 },
  { floor: "3.B", areaSqm: 2174.35 },
  { floor: "4.B", areaSqm: 2174.35 },
].map((b) => ({ ...b, segments: BASEMENT_SEGMENTS }));

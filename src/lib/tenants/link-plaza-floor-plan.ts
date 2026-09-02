// Kaynak: Maslak_Link_Kat_Alanlar_.xlsx / Maslak_Link_Kat_Alanlar_.pdf ("Link Plaza" sayfası).
export const LINK_PLAZA_DISPLAY_TITLE = "MASLAK LINK PLAZA";

export interface FloorBarSegment {
  startPct: number;
  endPct: number;
  color: "orange" | "green" | null;
  dashed?: boolean;
}

/** Maslak Link Plaza'nın bina şeması görselini birebir yansıtmak için, gerçek Excel
 * dosyasından çıkarılan hücre birleştirme (merge) aralıkları ve dolgu renkleri (turuncu
 * FFCC99, yeşil C6EFCE) — E:S sütun aralığının yüzdesi olarak. Bar genişliği katın alanıyla
 * orantılı DEĞİL, doğrudan Excel'deki hücre genişliklerinden birebir alınmıştır. Anahtarlar
 * Tenant.floor ile birebir aynı (PDF'teki nihai adlandırmaya göre güncellendi). */
export const LINK_PLAZA_FLOOR_BAR_SEGMENTS: Record<string, FloorBarSegment[]> = {
  "14.ASMA KAT": [
    { startPct: 16.84, endPct: 29.56, color: null, dashed: true },
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
  // İki satırlı (ZEMİN KAT CAFE + ZEMİN KAT OFİS) birleşik bar: E:L + M:N ayrı birleştirmeler,
  // aynı renk ama aralarında ince bir çizgi bırakacak şekilde iki bitişik parça.
  "ZEMİN KAT CAFE": [
    { startPct: 0, endPct: 59.9, color: "orange" },
    { startPct: 59.9, endPct: 75.07, color: "orange" },
  ],
};

// "14.ASMA KAT" satırının KİRACILAR hücresi "14.KAT" satırına kadar birleşik (rowSpan).
export const LINK_PLAZA_MERGE_COMPANY_NAME_DOWN = new Set(["14.ASMA KAT"]);
// "ZEMİN KAT CAFE" satırının bar hücresi "ZEMİN KAT OFİS" satırına kadar birleşik (rowSpan).
export const LINK_PLAZA_MERGE_BAR_DOWN = new Set(["ZEMİN KAT CAFE"]);

const BASEMENT_SEGMENTS: FloorBarSegment[] = [{ startPct: 0, endPct: 100, color: null }];

export const LINK_PLAZA_BASEMENT_FLOORS: {
  floor: string;
  areaSqm: number;
  segments: FloorBarSegment[];
}[] = [
  { floor: "1.B. KAT", areaSqm: 2174.35 },
  { floor: "2.B. KAT", areaSqm: 2174.35 },
  { floor: "3.B. KAT", areaSqm: 2174.35 },
  { floor: "4.B. KAT", areaSqm: 2174.35 },
].map((b) => ({ ...b, segments: BASEMENT_SEGMENTS }));

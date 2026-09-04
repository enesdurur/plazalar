import { describe, expect, it } from "vitest";
import {
  allowsAdjustments,
  computeLinkPlazaBudget,
  elapsedMonths,
  isLockedMonth,
  SECTION_NAMES,
  type RawSection,
} from "./calc";

describe("isLockedMonth", () => {
  it("2026 Ocak-Haziran'ı kilitli sayar", () => {
    for (let m = 1; m <= 6; m++) {
      expect(isLockedMonth(2026, m)).toBe(true);
    }
  });

  it("2026 Temmuz ve sonrasını kilitli saymaz", () => {
    for (let m = 7; m <= 12; m++) {
      expect(isLockedMonth(2026, m)).toBe(false);
    }
  });

  it("2026 dışındaki yılları hiç kilitli saymaz", () => {
    expect(isLockedMonth(2025, 3)).toBe(false);
    expect(isLockedMonth(2027, 1)).toBe(false);
  });
});

describe("allowsAdjustments", () => {
  it("vardiyalı kadro kategorilerinde true döner", () => {
    expect(allowsAdjustments("GÜVENLİK")).toBe(true);
    expect(allowsAdjustments("TEKNİK")).toBe(true);
    expect(allowsAdjustments("TEMİZLİK")).toBe(true);
    expect(allowsAdjustments("BAHÇE")).toBe(true);
    expect(allowsAdjustments("VALE")).toBe(true);
  });

  it("büyük/küçük harf ve baş/son boşluğa duyarsızdır", () => {
    expect(allowsAdjustments("  vale  ")).toBe(true);
    expect(allowsAdjustments("teknik")).toBe(true);
  });

  it("YÖNETİM gibi diğer kategorilerde false döner", () => {
    expect(allowsAdjustments("YÖNETİM")).toBe(false);
  });

  it("boş/null kategoride false döner", () => {
    expect(allowsAdjustments(null)).toBe(false);
    expect(allowsAdjustments(undefined)).toBe(false);
    expect(allowsAdjustments("")).toBe(false);
  });
});

describe("elapsedMonths", () => {
  it("içinde bulunulan yılda bugünkü aya kadar sayar", () => {
    const now = new Date(2026, 4, 15); // 15 Mayıs 2026 (ay index 4 = Mayıs)
    expect(elapsedMonths(2026, now)).toBe(5);
  });

  it("geçmiş bir yıl için her zaman 12 döner", () => {
    expect(elapsedMonths(2020, new Date(2026, 0, 1))).toBe(12);
  });

  it("gelecek bir yıl için 0 döner", () => {
    expect(elapsedMonths(2030, new Date(2026, 0, 1))).toBe(0);
  });
});

describe("computeLinkPlazaBudget", () => {
  const sections: RawSection[] = [
    {
      name: SECTION_NAMES.personnel,
      items: [
        {
          id: "p1",
          category: "TEKNİK",
          label: "Teknik Personel",
          monthlyBudget: 1000,
          isFixedContract: true,
          fixedAmount: 1000,
          fill: null,
          autoSource: null,
          entries: [
            { month: 1, confirmed: true, manualAmount: null },
            { month: 2, confirmed: true, manualAmount: null },
          ],
          adjustments: [
            { id: "a1", month: 1, type: "OVERTIME", label: "Bayram mesaisi", amount: 200 },
          ],
        },
      ],
    },
    {
      name: SECTION_NAMES.management,
      items: [],
    },
    {
      name: SECTION_NAMES.other,
      items: [],
    },
  ];

  it("elle girilen tutar + fazla mesaiyi doğru toplar", () => {
    const result = computeLinkPlazaBudget(sections, 2026, new Date(2026, 5, 1), [1, 2]);
    const row = result.personnelRows[0];
    // Ocak: 1000 (sabit sözleşme onaylı) + 200 (fazla mesai) = 1200
    expect(row.actuals[0]).toBe(1200);
    // Şubat: 1000 (fazla mesai yok)
    expect(row.actuals[1]).toBe(1000);
    expect(row.realizedTotal).toBe(2200);
    expect(row.overtimeByMonth?.[0]).toBe(200);
  });

  it("budgetForPeriod sadece seçilen ay sayısına göre hesaplanır", () => {
    const result = computeLinkPlazaBudget(sections, 2026, new Date(2026, 5, 1), [1, 2]);
    const row = result.personnelRows[0];
    expect(row.budgetForPeriod).toBe(2000); // 1000 * 2 ay
    expect(row.budgetYearly).toBe(12000); // 1000 * 12, seçimden bağımsız
  });

  it("TEKNİK kategorisinde kırılım (adjustments) doğru işaretlenir", () => {
    const result = computeLinkPlazaBudget(sections, 2026, new Date(2026, 5, 1), [1, 2]);
    expect(allowsAdjustments(result.personnelRows[0].category)).toBe(true);
  });
});

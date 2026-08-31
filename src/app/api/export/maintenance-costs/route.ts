import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { newWorkbook, workbookResponse } from "@/lib/xlsx-response";
import { monthOfWeek, MONTH_NAMES } from "@/lib/plan/weeks";

export async function GET() {
  const plaza = await getSelectedPlaza();

  const [planEntries, inspectionEntries] = await Promise.all([
    prisma.maintenancePlanWeekEntry.findMany({
      where: {
        item: { plazaId: plaza.id },
        OR: [{ cost: { not: null } }, { sparePartCost: { not: null } }],
      },
      include: { item: true },
      orderBy: [{ year: "desc" }, { week: "desc" }],
    }),
    prisma.inspectionPlanWeekEntry.findMany({
      where: {
        item: { plazaId: plaza.id },
        OR: [{ cost: { not: null } }, { sparePartCost: { not: null } }],
      },
      include: { item: true },
      orderBy: [{ year: "desc" }, { week: "desc" }],
    }),
  ]);

  const workbook = newWorkbook();
  const sheet = workbook.addWorksheet("Bakım Maliyetleri");
  sheet.columns = [
    { header: "Kaynak", key: "source", width: 24 },
    { header: "Kalem", key: "related", width: 30 },
    { header: "Tarih", key: "date", width: 20 },
    { header: "Not", key: "note", width: 24 },
    { header: "Bakım Maliyeti", key: "cost", width: 14 },
    { header: "Para Birimi", key: "currency", width: 10 },
    { header: "Yedek Parça Maliyeti", key: "sparePartCost", width: 16 },
    { header: "Yedek Parça Para Birimi", key: "sparePartCurrency", width: 12 },
    { header: "Yedek Parça Notu", key: "sparePartNote", width: 24 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const e of planEntries) {
    sheet.addRow({
      source: "3. Firma Bakım Planı",
      related: e.item.label,
      date: `${MONTH_NAMES[monthOfWeek(e.week) - 1]} ${e.year} (${e.week}. hafta)`,
      note: e.note ?? "",
      cost: e.cost != null ? Number(e.cost) : "",
      currency: e.cost != null ? e.costCurrency : "",
      sparePartCost: e.sparePartCost != null ? Number(e.sparePartCost) : "",
      sparePartCurrency: e.sparePartCost != null ? e.sparePartCostCurrency : "",
      sparePartNote: e.sparePartNote ?? "",
    });
  }

  for (const e of inspectionEntries) {
    sheet.addRow({
      source: "Periyodik (Fenni) Muayene",
      related: e.item.label,
      date: `${MONTH_NAMES[monthOfWeek(e.week) - 1]} ${e.year} (${e.week}. hafta)`,
      note: e.note ?? "",
      cost: e.cost != null ? Number(e.cost) : "",
      currency: e.cost != null ? e.costCurrency : "",
      sparePartCost: e.sparePartCost != null ? Number(e.sparePartCost) : "",
      sparePartCurrency: e.sparePartCost != null ? e.sparePartCostCurrency : "",
      sparePartNote: e.sparePartNote ?? "",
    });
  }

  return workbookResponse(workbook, `${plaza.name} - Bakim Maliyetleri.xlsx`);
}

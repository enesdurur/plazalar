import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { newWorkbook, workbookResponse } from "@/lib/xlsx-response";
import { TOTAL_WEEKS, isPastWeek } from "@/lib/plan/weeks";

export async function GET(request: NextRequest) {
  const plaza = await getSelectedPlaza();
  const yearParam = request.nextUrl.searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
  const now = new Date();

  const [items, entries] = await Promise.all([
    prisma.maintenancePlanItem.findMany({
      where: { plazaId: plaza.id },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.maintenancePlanWeekEntry.findMany({
      where: { year, item: { plazaId: plaza.id } },
    }),
  ]);

  const entryMap = new Map(entries.map((e) => [`${e.itemId}-${e.week}`, e.completed]));

  const workbook = newWorkbook();
  const sheet = workbook.addWorksheet(`${year} Bakım Planı`);
  sheet.columns = [
    { header: "Bakım Kalemi", key: "label", width: 32 },
    { header: "Firma", key: "company", width: 20 },
    { header: "Yıllık Sayı", key: "yearlyCount", width: 12 },
    ...Array.from({ length: TOTAL_WEEKS }, (_, i) => ({
      header: `H${i + 1}`,
      key: `w${i + 1}`,
      width: 6,
    })),
  ];
  sheet.getRow(1).font = { bold: true };

  for (const item of items) {
    const row: Record<string, string | number> = {
      label: item.label,
      company: item.company ?? "",
      yearlyCount: item.yearlyCount ?? "",
    };
    for (let week = 1; week <= TOTAL_WEEKS; week++) {
      const completed = entryMap.get(`${item.id}-${week}`) ?? (isPastWeek(year, week, now) ? true : null);
      row[`w${week}`] = completed === true ? "Yapıldı" : completed === false ? "Yapılmadı" : "";
    }
    sheet.addRow(row);
  }

  return workbookResponse(workbook, `${plaza.name} - ${year} Yillik Bakim Plani.xlsx`);
}

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
    prisma.tenantMaintenanceItem.findMany({
      where: { tenant: { plazaId: plaza.id } },
      include: { tenant: true },
      orderBy: [{ tenant: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    }),
    prisma.tenantMaintenanceWeekEntry.findMany({
      where: { year, item: { tenant: { plazaId: plaza.id } } },
    }),
  ]);

  const entryMap = new Map(entries.map((e) => [`${e.itemId}-${e.week}`, e.completed]));

  const workbook = newWorkbook();
  const sheet = workbook.addWorksheet(`${year} Kiracı Bakımları`);
  sheet.columns = [
    { header: "Kat", key: "floor", width: 18 },
    { header: "Kiracı", key: "companyName", width: 26 },
    { header: "Bakım Türü", key: "label", width: 18 },
    ...Array.from({ length: TOTAL_WEEKS }, (_, i) => ({
      header: `H${i + 1}`,
      key: `w${i + 1}`,
      width: 5,
    })),
  ];
  sheet.getRow(1).font = { bold: true };

  for (const item of items) {
    const scheduled = new Set(item.scheduledWeeks);
    const row: Record<string, string> = {
      floor: item.tenant.floor,
      companyName: item.tenant.companyName,
      label: item.label,
    };
    for (let week = 1; week <= TOTAL_WEEKS; week++) {
      if (!scheduled.has(week)) {
        row[`w${week}`] = "";
        continue;
      }
      const completed = entryMap.get(`${item.id}-${week}`) ?? (isPastWeek(year, week, now) ? true : null);
      row[`w${week}`] = completed === true ? "Yapıldı" : completed === false ? "Yapılmadı" : "Bekliyor";
    }
    sheet.addRow(row);
  }

  return workbookResponse(workbook, `${plaza.name} - ${year} Kiraci Bakimlari.xlsx`);
}

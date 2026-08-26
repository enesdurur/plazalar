import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { newWorkbook, workbookResponse } from "@/lib/xlsx-response";

const MONTHS = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

export async function GET(request: NextRequest) {
  const plaza = await getSelectedPlaza();
  const yearParam = request.nextUrl.searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  const [machines, entries] = await Promise.all([
    prisma.machine.findMany({ where: { plazaId: plaza.id }, orderBy: { name: "asc" } }),
    prisma.maintenancePlanEntry.findMany({
      where: { year, machine: { plazaId: plaza.id } },
    }),
  ]);

  const entryMap = new Map(entries.map((e) => [`${e.machineId}-${e.month}`, e.completed]));

  const workbook = newWorkbook();
  const sheet = workbook.addWorksheet(`${year} Bakım Planı`);
  sheet.columns = [
    { header: "Makine", key: "machine", width: 22 },
    ...MONTHS.map((m, i) => ({ header: m, key: `m${i + 1}`, width: 10 })),
  ];
  sheet.getRow(1).font = { bold: true };

  for (const machine of machines) {
    const row: Record<string, string> = { machine: machine.name };
    for (let month = 1; month <= 12; month++) {
      const completed = entryMap.get(`${machine.id}-${month}`);
      row[`m${month}`] =
        completed === true ? "Yapıldı" : completed === false ? "Yapılmadı" : "";
    }
    sheet.addRow(row);
  }

  return workbookResponse(workbook, `${plaza.name} - ${year} Yillik Bakim Plani.xlsx`);
}

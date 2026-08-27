import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { newWorkbook, workbookResponse } from "@/lib/xlsx-response";

const MONTH_NAMES = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export async function GET() {
  const plaza = await getSelectedPlaza();

  const [inspections, planEntries] = await Promise.all([
    prisma.periodicInspection.findMany({
      where: { plazaId: plaza.id, cost: { not: null } },
      orderBy: { inspectionDate: "desc" },
    }),
    prisma.maintenancePlanEntry.findMany({
      where: { cost: { not: null }, machine: { plazaId: plaza.id } },
      include: { machine: true },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    }),
  ]);

  const workbook = newWorkbook();
  const sheet = workbook.addWorksheet("Bakım Maliyetleri");
  sheet.columns = [
    { header: "Kaynak", key: "source", width: 20 },
    { header: "İlgili", key: "related", width: 24 },
    { header: "Tarih", key: "date", width: 16 },
    { header: "Not", key: "note", width: 30 },
    { header: "Tutar", key: "cost", width: 12 },
    { header: "Para Birimi", key: "currency", width: 10 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const e of planEntries) {
    sheet.addRow({
      source: "Yıllık Bakım Planı",
      related: e.machine.name,
      date: `${MONTH_NAMES[e.month - 1]} ${e.year}`,
      note: e.note ?? "",
      cost: Number(e.cost),
      currency: e.costCurrency,
    });
  }

  for (const i of inspections) {
    sheet.addRow({
      source: "Periyodik Muayene",
      related: i.name,
      date: i.inspectionDate ? i.inspectionDate.toLocaleDateString("tr-TR") : "",
      note: "",
      cost: Number(i.cost),
      currency: i.costCurrency,
    });
  }

  return workbookResponse(workbook, `${plaza.name} - Bakim Maliyetleri.xlsx`);
}

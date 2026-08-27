import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { newWorkbook, workbookResponse } from "@/lib/xlsx-response";

export async function GET() {
  const plaza = await getSelectedPlaza();

  const records = await prisma.maintenanceRecord.findMany({
    where: { machine: { plazaId: plaza.id }, sparePartCost: { not: null } },
    include: { machine: true, sparePart: true },
    orderBy: { reportedAt: "desc" },
  });

  const workbook = newWorkbook();
  const sheet = workbook.addWorksheet("Bakım Maliyetleri");
  sheet.columns = [
    { header: "Tarih", key: "reportedAt", width: 16 },
    { header: "Makine", key: "machine", width: 24 },
    { header: "Açıklama", key: "description", width: 40 },
    { header: "Yedek Parça", key: "sparePart", width: 20 },
    { header: "Adet", key: "sparePartQty", width: 8 },
    { header: "Tutar", key: "cost", width: 12 },
    { header: "Para Birimi", key: "currency", width: 10 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const r of records) {
    sheet.addRow({
      reportedAt: r.reportedAt,
      machine: r.machine.name,
      description: r.description,
      sparePart: r.sparePart?.name ?? r.sparePartOther ?? "",
      sparePartQty: r.sparePartQty ?? "",
      cost: Number(r.sparePartCost),
      currency: r.sparePartCostCurrency,
    });
  }

  sheet.getColumn("reportedAt").numFmt = "dd.mm.yyyy hh:mm";

  return workbookResponse(workbook, `${plaza.name} - Bakim Maliyetleri.xlsx`);
}

import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { newWorkbook, workbookResponse } from "@/lib/xlsx-response";
import { validityStatus, VALIDITY_LABELS } from "@/lib/status";

export async function GET() {
  const plaza = await getSelectedPlaza();

  const items = await prisma.periodicInspection.findMany({
    where: { plazaId: plaza.id },
    orderBy: { nextInspectionDate: "asc" },
  });

  const workbook = newWorkbook();
  const sheet = workbook.addWorksheet("Periyodik Muayene");
  sheet.columns = [
    { header: "Kod", key: "code", width: 14 },
    { header: "Ekipman Adı", key: "name", width: 24 },
    { header: "Marka", key: "brand", width: 16 },
    { header: "Rapor No", key: "reportNo", width: 10 },
    { header: "Periyot", key: "period", width: 12 },
    { header: "Teknik Özellik", key: "technicalFeature", width: 20 },
    { header: "Son Muayene", key: "inspectionDate", width: 16 },
    { header: "Sonraki Muayene", key: "nextInspectionDate", width: 16 },
    { header: "Bulunduğu Yer", key: "location", width: 18 },
    { header: "Sorumlu Kişi", key: "responsiblePerson", width: 20 },
    { header: "Durum", key: "status", width: 14 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const i of items) {
    sheet.addRow({
      code: i.code ?? "",
      name: i.name,
      brand: i.brand ?? "",
      reportNo: i.reportNo ?? "",
      period: i.period ?? "",
      technicalFeature: i.technicalFeature ?? "",
      inspectionDate: i.inspectionDate ?? "",
      nextInspectionDate: i.nextInspectionDate ?? "",
      location: i.location ?? "",
      responsiblePerson: i.responsiblePerson ?? "",
      status: VALIDITY_LABELS[validityStatus(i.nextInspectionDate)],
    });
  }

  for (const key of ["inspectionDate", "nextInspectionDate"]) {
    sheet.getColumn(key).numFmt = "dd.mm.yyyy";
  }

  return workbookResponse(workbook, `${plaza.name} - Periyodik Muayene.xlsx`);
}

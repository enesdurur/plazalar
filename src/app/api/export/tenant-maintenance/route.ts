import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { newWorkbook, workbookResponse } from "@/lib/xlsx-response";
import { validityStatus, VALIDITY_LABELS } from "@/lib/status";

export async function GET() {
  const plaza = await getSelectedPlaza();

  const items = await prisma.tenantMaintenance.findMany({
    where: { tenant: { plazaId: plaza.id } },
    include: { tenant: true },
    orderBy: { nextMaintenanceDate: "asc" },
  });

  const workbook = newWorkbook();
  const sheet = workbook.addWorksheet("Kiracı Bakımları");
  sheet.columns = [
    { header: "Kat", key: "floor", width: 20 },
    { header: "Kiracı", key: "companyName", width: 24 },
    { header: "Bakım Türü", key: "maintenanceType", width: 22 },
    { header: "Periyot", key: "period", width: 14 },
    { header: "Son Bakım", key: "lastMaintenanceDate", width: 16 },
    { header: "Sonraki Bakım", key: "nextMaintenanceDate", width: 16 },
    { header: "Sorumlu Kişi", key: "responsiblePerson", width: 20 },
    { header: "Not", key: "note", width: 30 },
    { header: "Durum", key: "status", width: 14 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const i of items) {
    sheet.addRow({
      floor: i.tenant.floor,
      companyName: i.tenant.companyName,
      maintenanceType: i.maintenanceType,
      period: i.period ?? "",
      lastMaintenanceDate: i.lastMaintenanceDate ?? "",
      nextMaintenanceDate: i.nextMaintenanceDate ?? "",
      responsiblePerson: i.responsiblePerson ?? "",
      note: i.note ?? "",
      status: VALIDITY_LABELS[validityStatus(i.nextMaintenanceDate)],
    });
  }

  for (const key of ["lastMaintenanceDate", "nextMaintenanceDate"]) {
    sheet.getColumn(key).numFmt = "dd.mm.yyyy";
  }

  return workbookResponse(workbook, `${plaza.name} - Kiraci Bakimlari.xlsx`);
}

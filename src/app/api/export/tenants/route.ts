import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { newWorkbook, workbookResponse } from "@/lib/xlsx-response";

export async function GET() {
  const plaza = await getSelectedPlaza();

  const tenants = await prisma.tenant.findMany({
    where: { plazaId: plaza.id },
    include: { _count: { select: { maintenances: true } } },
    orderBy: { sortOrder: "asc" },
  });

  const workbook = newWorkbook();
  const sheet = workbook.addWorksheet("Kiracılar");
  sheet.columns = [
    { header: "Kat", key: "floor", width: 20 },
    { header: "Kiracı", key: "companyName", width: 24 },
    { header: "Bakım Kaydı", key: "maintenanceCount", width: 14 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const t of tenants) {
    sheet.addRow({
      floor: t.floor,
      companyName: t.companyName,
      maintenanceCount: t._count.maintenances,
    });
  }

  return workbookResponse(workbook, `${plaza.name} - Kiracilar.xlsx`);
}

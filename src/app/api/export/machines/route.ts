import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { newWorkbook, workbookResponse } from "@/lib/xlsx-response";

export async function GET() {
  const plaza = await getSelectedPlaza();

  const machines = await prisma.machine.findMany({
    where: { plazaId: plaza.id },
    include: { line: true },
    orderBy: { name: "asc" },
  });

  const workbook = newWorkbook();
  const sheet = workbook.addWorksheet("Makineler");
  sheet.columns = [
    { header: "Makine Adı", key: "name", width: 24 },
    { header: "Kod", key: "code", width: 14 },
    { header: "Hat", key: "line", width: 16 },
    { header: "Marka", key: "brand", width: 16 },
    { header: "Model", key: "model", width: 16 },
    { header: "Seri No", key: "serialNo", width: 16 },
    { header: "Adet", key: "quantity", width: 8 },
    { header: "Özellik", key: "feature", width: 18 },
    { header: "Gücü (KW)", key: "powerKw", width: 10 },
    { header: "Bulunduğu Yer", key: "location", width: 18 },
    { header: "Dağıtım Panosu", key: "distributionPanel", width: 18 },
    { header: "MCC Otomasyon Panosu", key: "mccPanel", width: 20 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const m of machines) {
    sheet.addRow({
      name: m.name,
      code: m.code ?? "",
      line: m.line?.name ?? "",
      brand: m.brand ?? "",
      model: m.model ?? "",
      serialNo: m.serialNo ?? "",
      quantity: m.quantity,
      feature: m.feature ?? "",
      powerKw: m.powerKw ?? "",
      location: m.location ?? "",
      distributionPanel: m.distributionPanel ?? "",
      mccPanel: m.mccPanel ?? "",
    });
  }

  return workbookResponse(workbook, `${plaza.name} - Makineler.xlsx`);
}

import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { newWorkbook, workbookResponse } from "@/lib/xlsx-response";
import { mtta, mttr } from "@/lib/kpi";

const OPERATION_LABELS: Record<string, string> = {
  ARIZA: "Arıza",
  BAKIM: "Bakım",
};

export async function GET() {
  const plaza = await getSelectedPlaza();

  const records = await prisma.maintenanceRecord.findMany({
    where: { machine: { plazaId: plaza.id } },
    include: { machine: true, issueType: true, technician: true, sparePart: true },
    orderBy: { reportedAt: "desc" },
  });

  const workbook = newWorkbook();
  const sheet = workbook.addWorksheet("Arıza-Bakım Kayıtları");
  sheet.columns = [
    { header: "Bildirim Zamanı", key: "reportedAt", width: 20 },
    { header: "Makine", key: "machine", width: 18 },
    { header: "İşlem Türü", key: "operationType", width: 12 },
    { header: "Kategori", key: "issueType", width: 20 },
    { header: "Açıklama", key: "description", width: 40 },
    { header: "Teknisyen", key: "technician", width: 16 },
    { header: "Müdahale Zamanı", key: "respondedAt", width: 20 },
    { header: "Bitiş Zamanı", key: "finishedAt", width: 20 },
    { header: "MTTA (dk)", key: "mtta", width: 10 },
    { header: "MTTR (dk)", key: "mttr", width: 10 },
    { header: "Durum", key: "status", width: 14 },
    { header: "Yedek Parça", key: "sparePart", width: 20 },
    { header: "Adet", key: "sparePartQty", width: 8 },
    { header: "Maliyet", key: "sparePartCost", width: 12 },
    { header: "Para Birimi", key: "sparePartCostCurrency", width: 10 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const r of records) {
    sheet.addRow({
      reportedAt: r.reportedAt,
      machine: r.machine.name,
      operationType: OPERATION_LABELS[r.operationType],
      issueType: r.issueType?.name ?? "",
      description: r.description,
      technician: r.technician?.name ?? "",
      respondedAt: r.respondedAt ?? "",
      finishedAt: r.finishedAt ?? "",
      mtta: mtta(r.reportedAt, r.respondedAt) ?? "",
      mttr: mttr(r.respondedAt, r.finishedAt) ?? "",
      status: r.finishedAt ? "Tamamlandı" : "Devam Ediyor",
      sparePart: r.sparePart?.name ?? r.sparePartOther ?? "",
      sparePartQty: r.sparePartQty ?? "",
      sparePartCost: r.sparePartCost ? Number(r.sparePartCost) : "",
      sparePartCostCurrency: r.sparePartCost ? r.sparePartCostCurrency : "",
    });
  }

  for (const key of ["reportedAt", "respondedAt", "finishedAt"]) {
    sheet.getColumn(key).numFmt = "dd.mm.yyyy hh:mm";
  }

  return workbookResponse(workbook, `${plaza.name} - Ariza-Bakim Kayitlari.xlsx`);
}

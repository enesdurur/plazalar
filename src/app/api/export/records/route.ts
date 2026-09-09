import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { newWorkbook, workbookResponse } from "@/lib/xlsx-response";
import { mtta, mttr } from "@/lib/kpi";

function toDays(minutes: number | null) {
  return minutes === null ? "" : Math.round(minutes / 1440);
}

export async function GET() {
  const plaza = await getSelectedPlaza();

  const records = await prisma.maintenanceRecord.findMany({
    where: { plazaId: plaza.id },
    include: { machine: true, issueTypes: true, technician: true, sparePart: true },
    orderBy: { reportedAt: "desc" },
  });

  const workbook = newWorkbook();
  const sheet = workbook.addWorksheet("Arıza Kayıtları");
  sheet.columns = [
    { header: "Bildirim Tarihi", key: "reportedAt", width: 16 },
    { header: "Makine", key: "machine", width: 18 },
    { header: "Kategori", key: "issueType", width: 20 },
    { header: "Açıklama", key: "description", width: 40 },
    { header: "Teknisyen", key: "technician", width: 16 },
    { header: "Müdahale Tarihi", key: "respondedAt", width: 16 },
    { header: "Bitiş Tarihi", key: "finishedAt", width: 16 },
    { header: "MTTA (gün)", key: "mtta", width: 10 },
    { header: "MTTR (gün)", key: "mttr", width: 10 },
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
      machine: r.machine?.name ?? "Genel İş",
      issueType: [...r.issueTypes.map((t) => t.name), ...(r.issueTypeOther ? [r.issueTypeOther] : [])].join(", "),
      description: r.description,
      technician: r.technician?.name ?? "",
      respondedAt: r.respondedAt ?? "",
      finishedAt: r.finishedAt ?? "",
      mtta: toDays(mtta(r.reportedAt, r.respondedAt)),
      mttr: toDays(mttr(r.respondedAt, r.finishedAt)),
      status: r.finishedAt ? "Tamamlandı" : "Devam Ediyor",
      sparePart: r.sparePart?.name ?? r.sparePartOther ?? "",
      sparePartQty: r.sparePartQty ?? "",
      sparePartCost: r.sparePartCost ? Number(r.sparePartCost) : "",
      sparePartCostCurrency: r.sparePartCost ? r.sparePartCostCurrency : "",
    });
  }

  for (const key of ["reportedAt", "respondedAt", "finishedAt"]) {
    sheet.getColumn(key).numFmt = "dd.mm.yyyy";
  }

  return workbookResponse(workbook, `${plaza.name} - Ariza-Bakim Kayitlari.xlsx`);
}

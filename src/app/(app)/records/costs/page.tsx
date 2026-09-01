import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canApprove, canAddInvoice, canAddMaintenanceForm } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { toAttachmentInfo } from "@/lib/attachments/service";
import { ExportLink } from "@/components/export-link";
import { PrintButton } from "@/components/print-button";
import { formatCostAmount } from "@/components/spare-part-cost-tile";
import { CostsTable } from "./costs-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arıza Maliyetleri",
};

export default async function MaintenanceCostsPage() {
  const session = await auth();
  const approver = canApprove(session?.user.role);
  const canForm = canAddMaintenanceForm(session?.user.role);
  const canInvoice = canAddInvoice(session?.user.role);
  const plaza = await getSelectedPlaza();

  const records = await prisma.maintenanceRecord.findMany({
    where: { machine: { plazaId: plaza.id }, sparePartCost: { not: null } },
    include: {
      machine: true,
      sparePart: true,
      attachments: { include: { uploadedBy: true } },
    },
    orderBy: { reportedAt: "desc" },
  });

  const totals = { TRY: 0, USD: 0, EUR: 0 };
  for (const r of records) {
    if (r.sparePartCost) {
      totals[r.sparePartCostCurrency] += Number(r.sparePartCost);
    }
  }

  // Prisma Decimal alanları Client Component'lere doğrudan aktarılamaz — düz sayıya çeviriyoruz.
  const recordsWithDocs = records.map((r) => ({
    ...r,
    sparePartCost: r.sparePartCost != null ? Number(r.sparePartCost) : null,
    sparePartExchangeRate: r.sparePartExchangeRate != null ? Number(r.sparePartExchangeRate) : null,
    formAttachment: toAttachmentInfo(r.attachments.find((a) => a.kind === "MAINTENANCE_FORM")),
    invoiceAttachment: toAttachmentInfo(r.attachments.find((a) => a.kind === "INVOICE")),
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← Panel
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">Arıza Maliyetleri</h1>
          <p className="mt-1 text-sm text-slate-500">
            Toplam {records.length} maliyetli kayıt · {formatCostAmount(totals.TRY, "TRY")}
            {totals.USD > 0 && ` · ${formatCostAmount(totals.USD, "USD")}`}
            {totals.EUR > 0 && ` · ${formatCostAmount(totals.EUR, "EUR")}`}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <PrintButton />
          <ExportLink href="/api/export/spare-part-costs" />
        </div>
      </div>

      <div className="mt-6">
        <CostsTable
          records={recordsWithDocs}
          approver={approver}
          canForm={canForm}
          canInvoice={canInvoice}
        />
      </div>
    </div>
  );
}

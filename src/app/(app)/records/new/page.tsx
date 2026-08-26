import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { RecordForm } from "../record-form";
import { createRecord } from "../actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yeni Kayıt",
};

export default async function NewRecordPage() {
  const plaza = await getSelectedPlaza();
  const [machines, issueTypes, technicians, spareParts] = await Promise.all([
    prisma.machine.findMany({ where: { plazaId: plaza.id }, orderBy: { name: "asc" } }),
    prisma.issueType.findMany({ orderBy: { name: "asc" } }),
    prisma.technician.findMany({ orderBy: { name: "asc" } }),
    prisma.sparePart.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Yeni Arıza / Bakım Kaydı</h1>
      <div className="mt-6">
        <RecordForm
          action={createRecord}
          machines={machines}
          issueTypes={issueTypes}
          technicians={technicians}
          spareParts={spareParts}
        />
      </div>
    </div>
  );
}

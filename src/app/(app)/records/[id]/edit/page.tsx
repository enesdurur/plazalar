import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { RecordForm } from "../../record-form";
import { updateRecord } from "../../actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kayıt Düzenle",
};

export default async function EditRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plaza = await getSelectedPlaza();

  const [record, machines, issueTypes, technicians, spareParts] = await Promise.all([
    prisma.maintenanceRecord.findFirst({ where: { id, machine: { plazaId: plaza.id } } }),
    prisma.machine.findMany({ where: { plazaId: plaza.id }, orderBy: { name: "asc" } }),
    prisma.issueType.findMany({ orderBy: { name: "asc" } }),
    prisma.technician.findMany({ orderBy: { name: "asc" } }),
    prisma.sparePart.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!record) notFound();

  const updateWithId = updateRecord.bind(null, id);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Kayıt Düzenle</h1>
      <div className="mt-6">
        <RecordForm
          action={updateWithId}
          machines={machines}
          issueTypes={issueTypes}
          technicians={technicians}
          spareParts={spareParts}
          record={record}
        />
      </div>
    </div>
  );
}

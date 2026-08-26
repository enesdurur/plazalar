import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { MachineForm } from "../../machine-form";
import { updateMachine } from "../../actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Makine Düzenle",
};

export default async function EditMachinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plaza = await getSelectedPlaza();

  const [machine, lines] = await Promise.all([
    prisma.machine.findFirst({ where: { id, plazaId: plaza.id } }),
    prisma.line.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!machine) notFound();

  const updateWithId = updateMachine.bind(null, id);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Makine Düzenle</h1>
      <div className="mt-6">
        <MachineForm action={updateWithId} lines={lines} machine={machine} />
      </div>
    </div>
  );
}

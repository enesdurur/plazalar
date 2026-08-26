import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSelectedPlaza } from "@/lib/plaza";
import { InspectionForm } from "../../inspection-form";
import { updateInspection } from "../../actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Muayene Kaydını Düzenle",
};

export default async function EditInspectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plaza = await getSelectedPlaza();
  const item = await prisma.periodicInspection.findFirst({
    where: { id, plazaId: plaza.id },
  });

  if (!item) notFound();

  const updateWithId = updateInspection.bind(null, id);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Periyodik Muayene Kaydını Düzenle</h1>
      <div className="mt-6">
        <InspectionForm action={updateWithId} item={item} />
      </div>
    </div>
  );
}

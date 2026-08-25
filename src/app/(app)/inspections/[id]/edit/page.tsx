import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InspectionForm } from "../../inspection-form";
import { updateInspection } from "../../actions";

export default async function EditInspectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await prisma.periodicInspection.findUnique({ where: { id } });

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

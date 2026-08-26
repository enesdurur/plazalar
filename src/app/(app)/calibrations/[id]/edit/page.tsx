import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CalibrationForm } from "../../calibration-form";
import { updateCalibration } from "../../actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kalibrasyon Kaydını Düzenle",
};

export default async function EditCalibrationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await prisma.calibration.findUnique({ where: { id } });

  if (!item) notFound();

  const updateWithId = updateCalibration.bind(null, id);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Kalibrasyon Kaydını Düzenle</h1>
      <div className="mt-6">
        <CalibrationForm action={updateWithId} item={item} />
      </div>
    </div>
  );
}

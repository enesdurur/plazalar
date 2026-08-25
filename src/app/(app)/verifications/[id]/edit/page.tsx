import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VerificationForm } from "../../verification-form";
import { updateVerification } from "../../actions";

export default async function EditVerificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await prisma.verification.findUnique({ where: { id } });

  if (!item) notFound();

  const updateWithId = updateVerification.bind(null, id);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Doğrulama Kaydını Düzenle</h1>
      <div className="mt-6">
        <VerificationForm action={updateWithId} item={item} />
      </div>
    </div>
  );
}

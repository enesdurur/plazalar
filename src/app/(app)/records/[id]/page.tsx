import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canAccessKapitalDashboard } from "@/lib/permissions";
import { getSelectedPlazaId } from "@/lib/plaza";
import { WorkProcessSection } from "../work-process-section";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teklifler",
};

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const record = await prisma.maintenanceRecord.findFirst({
    where: { id, plaza: { organizationId: session.user.organizationId } },
    include: {
      quotes: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!record) notFound();

  // Kapital paneli tüm plazaları birleşik gösterdiği için erişimi olsun; diğer kullanıcılar
  // sadece o an seçili olan plazadaki kayıtları görebilir (plaza-izolasyon sınırı).
  if (!canAccessKapitalDashboard(session.user.role)) {
    const selectedPlazaId = await getSelectedPlazaId();
    if (record.plazaId !== selectedPlazaId) notFound();
  }

  const writable = canWrite(session.user.role);

  return (
    <div>
      {writable && (
        <div className="flex justify-end">
          <Link
            href={`/records/${id}/edit`}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Düzenle
          </Link>
        </div>
      )}

      <WorkProcessSection
        recordId={id}
        issueTypes={[]}
        defaultTitle={record.workTitle}
        readOnly
        quotes={record.quotes.map((q) => ({
          id: q.id,
          contractorName: q.contractorName,
          workItem: q.workItem,
          amount: Number(q.amount),
          currency: q.currency,
          note: q.note,
          selected: q.selected,
        }))}
      />
    </div>
  );
}

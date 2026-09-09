import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canAccessKapitalDashboard } from "@/lib/permissions";
import { getSelectedPlazaId } from "@/lib/plaza";
import { WorkProcessSection } from "../work-process-section";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kayıt Detayı",
};

const GENERAL_WORK_LABEL = "Genel İş";
const COMPANY_LABELS: Record<string, string> = { KAPITAL: "Kapital", BURGAZ: "Burgaz" };

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
      plaza: true,
      machine: true,
      issueTypes: true,
      technician: true,
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
  const categoryLabel =
    [...record.issueTypes.map((t) => t.name), ...(record.issueTypeOther ? [record.issueTypeOther] : [])].join(
      ", "
    ) || "-";

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Kayıt Detayı</h1>
        {writable && (
          <Link
            href={`/records/${id}/edit`}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Düzenle
          </Link>
        )}
      </div>

      <dl className="mt-6 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-4 text-sm">
        <div>
          <dt className="font-medium text-slate-500">Plaza</dt>
          <dd className="mt-0.5 text-slate-900">{record.plaza.name}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Makine</dt>
          <dd className="mt-0.5 text-slate-900">{record.machine?.name ?? GENERAL_WORK_LABEL}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Şirket</dt>
          <dd className="mt-0.5 text-slate-900">{COMPANY_LABELS[record.responsibleCompany]}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Kategori</dt>
          <dd className="mt-0.5 text-slate-900">{categoryLabel}</dd>
        </div>
        <div className="col-span-2">
          <dt className="font-medium text-slate-500">Açıklama</dt>
          <dd className="mt-0.5 whitespace-pre-wrap text-slate-900">{record.description}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Arıza Bildirimini Yapan</dt>
          <dd className="mt-0.5 text-slate-900">{record.technician?.name ?? "-"}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Bildirim Tarihi</dt>
          <dd className="mt-0.5 text-slate-900">{record.reportedAt.toLocaleDateString("tr-TR")}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Müdahale Tarihi</dt>
          <dd className="mt-0.5 text-slate-900">
            {record.respondedAt ? record.respondedAt.toLocaleDateString("tr-TR") : "-"}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Bitiş Tarihi</dt>
          <dd className="mt-0.5 text-slate-900">
            {record.finishedAt ? record.finishedAt.toLocaleDateString("tr-TR") : "-"}
          </dd>
        </div>
      </dl>

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

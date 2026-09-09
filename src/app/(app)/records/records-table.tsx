"use client";

import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { deleteRecord } from "./actions";
import { WorkProcessSection, type QuoteInfo } from "./work-process-section";
import type { Machine, IssueType, Technician, MaintenanceRecord } from "@prisma/client";

const COMPANY_LABELS: Record<string, string> = {
  KAPITAL: "Kapital",
  BURGAZ: "Burgaz",
};

const GENERAL_WORK_LABEL = "Genel İş";

type RecordWithRelations = Omit<
  MaintenanceRecord,
  "sparePartCost" | "sparePartExchangeRate" | "awardedAmount" | "invoiceAmount" | "invoiceExchangeRate"
> & {
  sparePartCost: number | null;
  sparePartExchangeRate: number | null;
  awardedAmount: number | null;
  invoiceAmount: number | null;
  invoiceExchangeRate: number | null;
  machine: Machine | null;
  plaza?: { name: string };
  issueTypes: IssueType[];
  technician: Technician | null;
  quotes: QuoteInfo[];
};

function categoryLabel(r: RecordWithRelations) {
  const names = r.issueTypes.map((t) => t.name);
  if (r.issueTypeOther) names.push(r.issueTypeOther);
  return names.length > 0 ? names.join(", ") : "-";
}

export function RecordsTable({
  records,
  writable,
  deletable,
  emptyMessage,
  showPlaza,
}: {
  records: RecordWithRelations[];
  writable: boolean;
  deletable: boolean;
  emptyMessage: string;
  showPlaza?: boolean;
}) {
  const columns: DataTableColumn<RecordWithRelations>[] = [
    {
      key: "reportedAt",
      header: "Bildirim Tarihi",
      width: "120px",
      filterValue: (r) => r.reportedAt.toLocaleDateString("tr-TR"),
      render: (r) => (
        <span className="whitespace-nowrap text-slate-600">
          {r.reportedAt.toLocaleDateString("tr-TR")}
        </span>
      ),
    },
    ...(showPlaza
      ? [
          {
            key: "plaza",
            header: "Plaza",
            width: "140px",
            filterValue: (r: RecordWithRelations) => r.plaza?.name ?? "-",
            render: (r: RecordWithRelations) => (
              <span className="text-slate-600">{r.plaza?.name ?? "-"}</span>
            ),
          } satisfies DataTableColumn<RecordWithRelations>,
        ]
      : []),
    {
      key: "machine",
      header: "Makine",
      width: "150px",
      filterValue: (r) => r.machine?.name ?? GENERAL_WORK_LABEL,
      render: (r) => (
        <span className="font-medium text-slate-900">{r.machine?.name ?? GENERAL_WORK_LABEL}</span>
      ),
    },
    {
      key: "company",
      header: "Şirket",
      width: "90px",
      filterValue: (r) => COMPANY_LABELS[r.responsibleCompany],
      render: (r) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            r.responsibleCompany === "KAPITAL"
              ? "bg-indigo-100 text-indigo-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {COMPANY_LABELS[r.responsibleCompany]}
        </span>
      ),
    },
    {
      key: "issueType",
      header: "Kategori",
      width: "150px",
      filterValue: categoryLabel,
      render: (r) => <span className="text-slate-600">{categoryLabel(r)}</span>,
    },
    {
      key: "description",
      header: "Açıklama",
      width: "300px",
      render: (r) => (
        <span className="block truncate text-slate-600" title={r.description}>
          {r.description}
        </span>
      ),
    },
    {
      key: "technician",
      header: "Teknisyen",
      width: "140px",
      filterValue: (r) => r.technician?.name ?? "-",
      render: (r) => <span className="text-slate-600">{r.technician?.name ?? "-"}</span>,
    },
    {
      key: "finishedAt",
      header: "Bitiş Tarihi",
      width: "120px",
      filterValue: (r) => (r.finishedAt ? r.finishedAt.toLocaleDateString("tr-TR") : "-"),
      render: (r) => (
        <span className="whitespace-nowrap text-slate-600">
          {r.finishedAt ? r.finishedAt.toLocaleDateString("tr-TR") : "-"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Durum",
      width: "140px",
      filterValue: (r) => (r.finishedAt ? "Tamamlandı" : "Devam Ediyor"),
      render: (r) =>
        r.finishedAt ? (
          <span className="whitespace-nowrap rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Tamamlandı
          </span>
        ) : (
          <span className="whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            Devam Ediyor
          </span>
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={records}
      rowKey={(r) => r.id}
      emptyMessage={emptyMessage}
      maxHeight="50vh"
      actionsWidth="110px"
      renderExpanded={(r) => (
        <WorkProcessSection
          recordId={r.id}
          issueTypes={[]}
          defaultTitle={r.workTitle}
          readOnly
          quotes={r.quotes}
          invoice={{
            invoiceNo: r.invoiceNo,
            invoiceAmount: r.invoiceAmount,
            invoiceCurrency: r.invoiceCurrency,
            invoicedAt: r.invoicedAt ? r.invoicedAt.toISOString() : null,
            approved: r.approved,
          }}
        />
      )}
      renderActions={(r) => (
        <>
          {writable && (
            <Link
              href={`/records/${r.id}/edit`}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Düzenle
            </Link>
          )}
          {deletable && <DeleteButton action={deleteRecord.bind(null, r.id)} />}
        </>
      )}
    />
  );
}

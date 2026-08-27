"use client";

import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { StatusBadge } from "@/components/status-badge";
import { validityStatus, VALIDITY_LABELS } from "@/lib/status";
import { deleteInspection } from "./actions";
import type { PeriodicInspection } from "@prisma/client";

export function InspectionsTable({
  items,
  writable,
  deletable,
}: {
  items: PeriodicInspection[];
  writable: boolean;
  deletable: boolean;
}) {
  const columns: DataTableColumn<PeriodicInspection>[] = [
    {
      key: "code",
      header: "Kod",
      filterValue: (i) => i.code ?? "-",
      render: (i) => <span className="text-slate-600">{i.code ?? "-"}</span>,
    },
    {
      key: "name",
      header: "Ekipman Adı",
      filterValue: (i) => i.name,
      render: (i) => <span className="font-medium text-slate-900">{i.name}</span>,
    },
    {
      key: "period",
      header: "Periyot",
      filterValue: (i) => i.period ?? "-",
      render: (i) => <span className="text-slate-600">{i.period ?? "-"}</span>,
    },
    {
      key: "location",
      header: "Bölüm",
      filterValue: (i) => i.location ?? "-",
      render: (i) => <span className="text-slate-600">{i.location ?? "-"}</span>,
    },
    {
      key: "inspectionDate",
      header: "Son Muayene",
      filterValue: (i) => (i.inspectionDate ? i.inspectionDate.toLocaleDateString("tr-TR") : "-"),
      render: (i) => (
        <span className="whitespace-nowrap text-slate-600">
          {i.inspectionDate ? i.inspectionDate.toLocaleDateString("tr-TR") : "-"}
        </span>
      ),
    },
    {
      key: "nextInspectionDate",
      header: "Sonraki Muayene",
      filterValue: (i) =>
        i.nextInspectionDate ? i.nextInspectionDate.toLocaleDateString("tr-TR") : "-",
      render: (i) => (
        <span className="whitespace-nowrap text-slate-600">
          {i.nextInspectionDate ? i.nextInspectionDate.toLocaleDateString("tr-TR") : "-"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Durum",
      filterValue: (i) => VALIDITY_LABELS[validityStatus(i.nextInspectionDate)],
      render: (i) => <StatusBadge nextDate={i.nextInspectionDate} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={items}
      rowKey={(i) => i.id}
      emptyMessage="Henüz kayıt yok."
      maxHeight="70vh"
      renderActions={(i) => (
        <>
          {writable && (
            <Link
              href={`/inspections/${i.id}/edit`}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Düzenle
            </Link>
          )}
          {deletable && <DeleteButton action={deleteInspection.bind(null, i.id)} />}
        </>
      )}
    />
  );
}

"use client";

import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { deleteMachine } from "./actions";
import type { Machine } from "@prisma/client";

type MachineWithCount = Machine & { _count: { records: number } };

export function MachinesTable({
  machines,
  writable,
  deletable,
}: {
  machines: MachineWithCount[];
  writable: boolean;
  deletable: boolean;
}) {
  const columns: DataTableColumn<MachineWithCount>[] = [
    {
      key: "name",
      header: "Makine Adı",
      filterValue: (m) => m.name,
      render: (m) => <span className="font-medium text-slate-900">{m.name}</span>,
    },
    {
      key: "brandModel",
      header: "Marka / Model",
      filterValue: (m) => [m.brand, m.model].filter(Boolean).join(" / ") || "-",
      render: (m) => (
        <span className="text-slate-600">
          {[m.brand, m.model].filter(Boolean).join(" / ") || "-"}
        </span>
      ),
    },
    {
      key: "location",
      header: "Bölüm",
      filterValue: (m) => m.location ?? "-",
      render: (m) => <span className="text-slate-600">{m.location ?? "-"}</span>,
    },
    {
      key: "recordCount",
      header: "Kayıt Sayısı",
      filterValue: (m) => String(m._count.records),
      render: (m) => <span className="text-slate-600">{m._count.records}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={machines}
      rowKey={(m) => m.id}
      emptyMessage="Henüz makine kaydı yok."
      maxHeight="70vh"
      renderActions={(m) => (
        <>
          {writable && (
            <Link
              href={`/machines/${m.id}/edit`}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Düzenle
            </Link>
          )}
          {deletable && <DeleteButton action={deleteMachine.bind(null, m.id)} />}
        </>
      )}
    />
  );
}

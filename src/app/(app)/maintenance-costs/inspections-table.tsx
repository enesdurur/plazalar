"use client";

import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { formatCostAmount } from "@/components/spare-part-cost-tile";
import type { PeriodicInspection } from "@prisma/client";

export function InspectionsCostTable({ items }: { items: PeriodicInspection[] }) {
  const columns: DataTableColumn<PeriodicInspection>[] = [
    {
      key: "name",
      header: "Ekipman",
      filterValue: (i) => i.name,
      render: (i) => <span className="font-medium text-slate-900">{i.name}</span>,
    },
    {
      key: "inspectionDate",
      header: "Muayene Tarihi",
      filterValue: (i) => (i.inspectionDate ? i.inspectionDate.toLocaleDateString("tr-TR") : "-"),
      render: (i) => (
        <span className="whitespace-nowrap text-slate-600">
          {i.inspectionDate ? i.inspectionDate.toLocaleDateString("tr-TR") : "-"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Tutar",
      align: "right",
      money: (i) => (i.cost != null ? { amount: Number(i.cost), currency: i.costCurrency } : null),
      render: (i) => (
        <span className="whitespace-nowrap font-medium tabular-nums text-slate-900">
          {formatCostAmount(Number(i.cost), i.costCurrency)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={items}
      rowKey={(i) => i.id}
      emptyMessage="Henüz maliyetli bir periyodik muayene kaydı yok."
      maxHeight="50vh"
      renderActions={(i) => (
        <Link
          href={`/inspections/${i.id}/edit`}
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Düzenle
        </Link>
      )}
    />
  );
}

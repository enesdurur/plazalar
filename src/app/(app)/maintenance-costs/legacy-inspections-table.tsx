"use client";

import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { formatCostAmount } from "@/components/spare-part-cost-tile";
import type { PeriodicInspection } from "@prisma/client";

type Row = Omit<PeriodicInspection, "cost"> & { cost: number | null };

/** Haftalık matrise geçmeden önceki eski Periyodik Muayene kayıtları (PeriodicInspection) —
 * artık bu sayfadan (nav'da linki olmayan /inspections/[id]/edit üzerinden) düzenlenebilir,
 * ama günlük kullanım Periyodik (Fenni) Muayene sayfasındaki haftalık matris üzerinden. */
export function LegacyInspectionsTable({ items }: { items: Row[] }) {
  const columns: DataTableColumn<Row>[] = [
    {
      key: "name",
      header: "Ekipman",
      width: "240px",
      filterValue: (r) => r.name,
      render: (r) => <span className="font-medium text-slate-900">{r.name}</span>,
    },
    {
      key: "code",
      header: "Kod",
      width: "100px",
      render: (r) => <span className="text-slate-600">{r.code ?? "-"}</span>,
    },
    {
      key: "date",
      header: "Muayene Tarihi",
      width: "150px",
      render: (r) => (
        <span className="whitespace-nowrap text-slate-600">
          {r.inspectionDate ? r.inspectionDate.toLocaleDateString("tr-TR") : "-"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Tutar",
      width: "150px",
      align: "right",
      money: (r) => (r.cost != null ? { amount: r.cost, currency: r.costCurrency } : null),
      render: (r) =>
        r.cost != null ? (
          <span className="whitespace-nowrap font-medium tabular-nums text-slate-900">
            {formatCostAmount(r.cost, r.costCurrency)}
          </span>
        ) : (
          <span className="text-slate-300">-</span>
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={items}
      rowKey={(r) => r.id}
      emptyMessage="Maliyetli eski kayıt yok."
      maxHeight="40vh"
      actionsWidth="90px"
      renderActions={(r) => (
        <Link
          href={`/inspections/${r.id}/edit`}
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Düzenle
        </Link>
      )}
    />
  );
}

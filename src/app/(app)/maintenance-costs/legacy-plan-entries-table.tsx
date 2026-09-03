"use client";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { formatCostAmount } from "@/components/spare-part-cost-tile";
import { MONTH_NAMES } from "@/lib/plan/weeks";
import type { MaintenancePlanEntry, Machine } from "@prisma/client";

type Row = Omit<MaintenancePlanEntry, "cost"> & { cost: number | null; machine: Machine };

/** Haftalık matrise geçmeden önceki eski aylık Yıllık Bakım Planı kayıtları
 * (MaintenancePlanEntry) — düzenleme ekranı hiç yapılmadı, salt-okunur gösterilir. */
export function LegacyPlanEntriesTable({ entries }: { entries: Row[] }) {
  const columns: DataTableColumn<Row>[] = [
    {
      key: "machine",
      header: "Makine",
      width: "220px",
      filterValue: (e) => e.machine.name,
      render: (e) => <span className="font-medium text-slate-900">{e.machine.name}</span>,
    },
    {
      key: "monthYear",
      header: "Ay / Yıl",
      width: "150px",
      render: (e) => (
        <span className="whitespace-nowrap text-slate-600">
          {MONTH_NAMES[e.month - 1]} {e.year}
        </span>
      ),
    },
    {
      key: "note",
      header: "Not",
      render: (e) => <span className="text-slate-600">{e.note ?? "-"}</span>,
    },
    {
      key: "amount",
      header: "Tutar",
      width: "150px",
      align: "right",
      money: (e) => (e.cost != null ? { amount: e.cost, currency: e.costCurrency } : null),
      render: (e) =>
        e.cost != null ? (
          <span className="whitespace-nowrap font-medium tabular-nums text-slate-900">
            {formatCostAmount(e.cost, e.costCurrency)}
          </span>
        ) : (
          <span className="text-slate-300">-</span>
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={entries}
      rowKey={(e) => e.id}
      emptyMessage="Maliyetli eski kayıt yok."
      maxHeight="40vh"
    />
  );
}

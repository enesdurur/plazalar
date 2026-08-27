"use client";

import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { formatCostAmount } from "@/components/spare-part-cost-tile";
import type { Machine, MaintenancePlanEntry } from "@prisma/client";

const MONTH_NAMES = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

type PlanEntryWithMachine = MaintenancePlanEntry & { machine: Machine };

export function PlanEntriesTable({ entries }: { entries: PlanEntryWithMachine[] }) {
  const columns: DataTableColumn<PlanEntryWithMachine>[] = [
    {
      key: "machine",
      header: "Makine",
      filterValue: (e) => e.machine.name,
      render: (e) => <span className="font-medium text-slate-900">{e.machine.name}</span>,
    },
    {
      key: "monthYear",
      header: "Ay / Yıl",
      filterValue: (e) => `${MONTH_NAMES[e.month - 1]} ${e.year}`,
      render: (e) => (
        <span className="whitespace-nowrap text-slate-600">
          {MONTH_NAMES[e.month - 1]} {e.year}
        </span>
      ),
    },
    {
      key: "note",
      header: "Not",
      render: (e) => <span className="max-w-xs truncate text-slate-600">{e.note ?? "-"}</span>,
    },
    {
      key: "amount",
      header: "Tutar",
      align: "right",
      money: (e) => (e.cost != null ? { amount: Number(e.cost), currency: e.costCurrency } : null),
      render: (e) => (
        <span className="whitespace-nowrap font-medium tabular-nums text-slate-900">
          {formatCostAmount(Number(e.cost), e.costCurrency)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={entries}
      rowKey={(e) => e.id}
      emptyMessage="Henüz maliyetli bir yıllık bakım kaydı yok."
      maxHeight="50vh"
      renderActions={(e) => (
        <Link
          href={`/annual-plan/entries/${e.id}/edit`}
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Düzenle
        </Link>
      )}
    />
  );
}

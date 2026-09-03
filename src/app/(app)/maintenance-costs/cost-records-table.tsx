"use client";

import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { formatCostAmount } from "@/components/spare-part-cost-tile";
import type { Currency } from "@prisma/client";

/** Haftalık matris kayıtlarıyla, haftalık matrise geçilmeden önceki eski kayıtları tek bir
 * listede, aralarında görsel fark olmadan gösterebilmek için ortak satır şekli. */
export type CostRecordRow = {
  id: string;
  label: string;
  monthYearLabel: string;
  cost: number | null;
  costCurrency: Currency;
  sparePartCost: number | null;
  sparePartCostCurrency: Currency;
  sparePartNote: string | null;
  /** null: bu kaydın düzenlenebileceği bir ekran yok (yalnızca eski MaintenancePlanEntry kayıtlarında). */
  editHref: string | null;
};

export function CostRecordsTable({
  rows,
  itemColumnHeader,
  emptyMessage,
}: {
  rows: CostRecordRow[];
  itemColumnHeader: string;
  emptyMessage: string;
}) {
  const columns: DataTableColumn<CostRecordRow>[] = [
    {
      key: "label",
      header: itemColumnHeader,
      width: "260px",
      filterValue: (r) => r.label,
      render: (r) => <span className="font-medium text-slate-900">{r.label}</span>,
    },
    {
      key: "monthYear",
      header: "Ay / Yıl",
      width: "190px",
      filterValue: (r) => r.monthYearLabel,
      render: (r) => (
        <span className="whitespace-nowrap text-slate-600">{r.monthYearLabel}</span>
      ),
    },
    {
      key: "amount",
      header: "Bakım Maliyeti",
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
    {
      key: "sparePart",
      header: "Yedek Parça",
      width: "220px",
      align: "right",
      money: (r) =>
        r.sparePartCost != null
          ? { amount: r.sparePartCost, currency: r.sparePartCostCurrency }
          : null,
      render: (r) =>
        r.sparePartCost != null ? (
          <span className="whitespace-nowrap font-medium tabular-nums text-amber-600">
            🔧 {formatCostAmount(r.sparePartCost, r.sparePartCostCurrency)}
            {r.sparePartNote && <span className="ml-1 text-slate-400">({r.sparePartNote})</span>}
          </span>
        ) : (
          <span className="text-slate-300">-</span>
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      emptyMessage={emptyMessage}
      maxHeight="50vh"
      actionsWidth="90px"
      renderActions={(r) =>
        r.editHref ? (
          <Link
            href={r.editHref}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Düzenle
          </Link>
        ) : null
      }
    />
  );
}

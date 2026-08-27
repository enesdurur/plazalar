"use client";

import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { StatusBadge } from "@/components/status-badge";
import { validityStatus, VALIDITY_LABELS } from "@/lib/status";
import { deleteTenantMaintenance } from "./actions";
import type { Tenant, TenantMaintenance } from "@prisma/client";

type ItemWithTenant = TenantMaintenance & { tenant: Tenant };

export function TenantMaintenanceTable({
  items,
  writable,
  deletable,
}: {
  items: ItemWithTenant[];
  writable: boolean;
  deletable: boolean;
}) {
  const columns: DataTableColumn<ItemWithTenant>[] = [
    {
      key: "floor",
      header: "Kat",
      filterValue: (i) => i.tenant.floor,
      render: (i) => <span className="text-slate-600">{i.tenant.floor}</span>,
    },
    {
      key: "companyName",
      header: "Kiracı",
      filterValue: (i) => i.tenant.companyName,
      render: (i) => <span className="font-medium text-slate-900">{i.tenant.companyName}</span>,
    },
    {
      key: "maintenanceType",
      header: "Bakım Türü",
      filterValue: (i) => i.maintenanceType,
      render: (i) => <span className="text-slate-600">{i.maintenanceType}</span>,
    },
    {
      key: "period",
      header: "Periyot",
      filterValue: (i) => i.period ?? "-",
      render: (i) => <span className="text-slate-600">{i.period ?? "-"}</span>,
    },
    {
      key: "lastMaintenanceDate",
      header: "Son Bakım",
      filterValue: (i) =>
        i.lastMaintenanceDate ? i.lastMaintenanceDate.toLocaleDateString("tr-TR") : "-",
      render: (i) => (
        <span className="whitespace-nowrap text-slate-600">
          {i.lastMaintenanceDate ? i.lastMaintenanceDate.toLocaleDateString("tr-TR") : "-"}
        </span>
      ),
    },
    {
      key: "nextMaintenanceDate",
      header: "Sonraki Bakım",
      filterValue: (i) =>
        i.nextMaintenanceDate ? i.nextMaintenanceDate.toLocaleDateString("tr-TR") : "-",
      render: (i) => (
        <span className="whitespace-nowrap text-slate-600">
          {i.nextMaintenanceDate ? i.nextMaintenanceDate.toLocaleDateString("tr-TR") : "-"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Durum",
      filterValue: (i) => VALIDITY_LABELS[validityStatus(i.nextMaintenanceDate)],
      render: (i) => <StatusBadge nextDate={i.nextMaintenanceDate} />,
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
              href={`/tenant-maintenance/${i.id}/edit`}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Düzenle
            </Link>
          )}
          {deletable && <DeleteButton action={deleteTenantMaintenance.bind(null, i.id)} />}
        </>
      )}
    />
  );
}

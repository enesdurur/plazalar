"use client";

import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { deleteTenant } from "./actions";
import type { Tenant } from "@prisma/client";

type TenantWithCount = Tenant & { _count: { maintenances: number } };

export function TenantsTable({
  tenants,
  writable,
  deletable,
}: {
  tenants: TenantWithCount[];
  writable: boolean;
  deletable: boolean;
}) {
  const columns: DataTableColumn<TenantWithCount>[] = [
    {
      key: "floor",
      header: "Kat",
      filterValue: (t) => t.floor,
      render: (t) => <span className="font-medium text-slate-900">{t.floor}</span>,
    },
    {
      key: "companyName",
      header: "Kiracı",
      filterValue: (t) => t.companyName,
      render: (t) => <span className="text-slate-600">{t.companyName}</span>,
    },
    {
      key: "maintenanceCount",
      header: "Bakım Kaydı",
      filterValue: (t) => String(t._count.maintenances),
      render: (t) => <span className="text-slate-600">{t._count.maintenances}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={tenants}
      rowKey={(t) => t.id}
      emptyMessage="Henüz kiracı kaydı yok."
      maxHeight="70vh"
      renderActions={(t) => (
        <>
          {writable && (
            <Link
              href={`/tenants/${t.id}/edit`}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Düzenle
            </Link>
          )}
          {deletable && <DeleteButton action={deleteTenant.bind(null, t.id)} />}
        </>
      )}
    />
  );
}

"use client";

import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { deleteTenant } from "./actions";
import type { Tenant } from "@prisma/client";
import type { PlanYearStats } from "@/lib/plan/stats";

export function TenantsTable({
  tenants,
  maintenanceStatsByTenant,
  maintenanceYear,
  writable,
  deletable,
}: {
  tenants: Tenant[];
  maintenanceStatsByTenant: Map<string, PlanYearStats>;
  maintenanceYear: number;
  writable: boolean;
  deletable: boolean;
}) {
  const columns: DataTableColumn<Tenant>[] = [
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
      key: "maintenanceStatus",
      header: `Bakım Kaydı (${maintenanceYear})`,
      filterValue: (t) => {
        const s = maintenanceStatsByTenant.get(t.id);
        return s ? `${s.done} yapıldı ${s.missed} yapılmadı ${s.pending} bekliyor` : "";
      },
      render: (t) => {
        const s = maintenanceStatsByTenant.get(t.id);
        if (!s || s.totalScheduled === 0) {
          return <span className="text-xs text-slate-400">Kayıt yok</span>;
        }
        return (
          <Link
            href="/tenant-maintenance"
            className="flex flex-wrap gap-1 hover:opacity-80"
            title="Kiracı Bakımları sayfasına git"
          >
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              {s.done} Yapıldı
            </span>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {s.missed} Yapılmadı
            </span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              {s.pending} Bekliyor
            </span>
          </Link>
        );
      },
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

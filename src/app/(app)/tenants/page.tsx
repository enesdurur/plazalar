import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { ExportLink } from "@/components/export-link";
import { PrintButton } from "@/components/print-button";
import { computePlanYearStats, type PlanYearStats } from "@/lib/plan/stats";
import { TenantBuildingView, type BuildingFloorRow } from "@/components/tenant-building-view";
import {
  LINK_PLAZA_FLOOR_COLORS,
  LINK_PLAZA_BASEMENT_FLOORS,
  LINK_PLAZA_DISPLAY_TITLE,
} from "@/lib/tenants/link-plaza-floor-plan";
import { TenantsTable } from "./tenants-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kiracılar",
};

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const params = await searchParams;
  const view = params.view === "gorsel" ? "gorsel" : "liste";

  const session = await auth();
  const writable = canWrite(session?.user.role);
  const deletable = canDelete(session?.user.role);
  const plaza = await getSelectedPlaza();
  const year = new Date().getFullYear();

  const [tenants, maintenanceItems, maintenanceEntries] = await Promise.all([
    prisma.tenant.findMany({
      where: { plazaId: plaza.id },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.tenantMaintenanceItem.findMany({
      where: { tenant: { plazaId: plaza.id } },
      select: { id: true, tenantId: true, label: true, scheduledWeeks: true },
    }),
    prisma.tenantMaintenanceWeekEntry.findMany({
      where: { year, item: { tenant: { plazaId: plaza.id } } },
      select: { itemId: true, week: true, completed: true },
    }),
  ]);

  const itemsByTenant = new Map<string, typeof maintenanceItems>();
  for (const item of maintenanceItems) {
    const list = itemsByTenant.get(item.tenantId) ?? [];
    list.push(item);
    itemsByTenant.set(item.tenantId, list);
  }
  const entriesByItemId = new Map<string, typeof maintenanceEntries>();
  for (const entry of maintenanceEntries) {
    const list = entriesByItemId.get(entry.itemId) ?? [];
    list.push(entry);
    entriesByItemId.set(entry.itemId, list);
  }

  const maintenanceStatsByTenant = new Map<string, PlanYearStats>();
  for (const tenant of tenants) {
    const items = itemsByTenant.get(tenant.id) ?? [];
    const entries = items.flatMap((i) => entriesByItemId.get(i.id) ?? []);
    maintenanceStatsByTenant.set(
      tenant.id,
      computePlanYearStats(items, entries, year, undefined, "done")
    );
  }

  const nextSortOrder = tenants.length
    ? Math.max(...tenants.map((t) => t.sortOrder)) + 1
    : 0;

  const isLinkPlaza = plaza.name === "Link Plaza";
  // Building elevation reads top floor -> ground -> basement, the reverse of the
  // Kiracılar list's own bottom-up sortOrder (ground floor first, for data entry).
  const buildingRows: BuildingFloorRow[] = [
    ...[...tenants].reverse().map((t) => ({
      key: t.id,
      floor: t.floor,
      companyName: t.companyName,
      areaSqm: t.areaSqm != null ? Number(t.areaSqm) : null,
      barColor: isLinkPlaza ? (LINK_PLAZA_FLOOR_COLORS[t.floor] ?? null) : null,
    })),
    ...(isLinkPlaza
      ? LINK_PLAZA_BASEMENT_FLOORS.map((b) => ({
          key: b.floor,
          floor: b.floor,
          companyName: "",
          areaSqm: b.areaSqm,
          barColor: null,
        }))
      : []),
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Kiracılar</h1>
          <p className="mt-1 text-sm text-slate-500">Toplam {tenants.length} kiracı kaydı.</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <PrintButton />
          <ExportLink href="/api/export/tenants" />
          {writable && (
            <Link
              href={`/tenants/new?sortOrder=${nextSortOrder}`}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              + Yeni Kiracı
            </Link>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2 print:hidden">
        <Link
          href="/tenants?view=liste"
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            view === "liste"
              ? "bg-slate-900 text-white"
              : "border border-slate-300 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Liste
        </Link>
        <Link
          href="/tenants?view=gorsel"
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            view === "gorsel"
              ? "bg-slate-900 text-white"
              : "border border-slate-300 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Görsel
        </Link>
      </div>

      <div className="mt-6">
        {view === "gorsel" ? (
          <TenantBuildingView
            plazaName={isLinkPlaza ? LINK_PLAZA_DISPLAY_TITLE : plaza.name}
            rows={buildingRows}
          />
        ) : (
          <TenantsTable
            tenants={tenants}
            maintenanceStatsByTenant={maintenanceStatsByTenant}
            maintenanceYear={year}
            writable={writable}
            deletable={deletable}
          />
        )}
      </div>
    </div>
  );
}

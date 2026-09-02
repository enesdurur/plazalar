import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { canWrite } from "@/lib/permissions";
import { auth } from "@/auth";
import { getSelectedPlaza } from "@/lib/plaza";
import { ExportLink } from "@/components/export-link";
import { PrintButton } from "@/components/print-button";
import { TenantBuildingView, type BuildingFloorRow } from "@/components/tenant-building-view";
import { computePlanYearStats, type PlanYearStats } from "@/lib/plan/stats";
import {
  LINK_PLAZA_FLOOR_BAR_SEGMENTS,
  LINK_PLAZA_BASEMENT_FLOORS,
  LINK_PLAZA_DISPLAY_TITLE,
  LINK_PLAZA_MERGE_COMPANY_NAME_DOWN,
  LINK_PLAZA_MERGE_BAR_DOWN,
} from "@/lib/tenants/link-plaza-floor-plan";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kiracılar",
};

export default async function TenantsPage() {
  const session = await auth();
  const writable = canWrite(session?.user.role);
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

  const emptyMaintenanceStatus = computePlanYearStats([], [], year);
  const isLinkPlaza = plaza.name === "Link Plaza";
  // Building elevation reads top floor -> ground -> basement, the reverse of the
  // Kiracılar list's own bottom-up sortOrder (ground floor first, for data entry).
  const reversedTenants = [...tenants].reverse();
  const buildingRows: BuildingFloorRow[] = [
    ...reversedTenants.map((t, i) => {
      const prev = reversedTenants[i - 1];
      const next = reversedTenants[i + 1];
      const companyHidden = isLinkPlaza && !!prev && LINK_PLAZA_MERGE_COMPANY_NAME_DOWN.has(prev.floor);
      const barHidden = isLinkPlaza && !!prev && LINK_PLAZA_MERGE_BAR_DOWN.has(prev.floor);
      const mergesMaintenanceDown =
        isLinkPlaza && LINK_PLAZA_MERGE_COMPANY_NAME_DOWN.has(t.floor) && !!next;
      const maintenanceHidden =
        isLinkPlaza && !!prev && LINK_PLAZA_MERGE_COMPANY_NAME_DOWN.has(prev.floor);

      let maintenanceStatus = maintenanceStatsByTenant.get(t.id) ?? null;
      if (mergesMaintenanceDown) {
        const nextStatus = maintenanceStatsByTenant.get(next.id);
        if (nextStatus) {
          maintenanceStatus = {
            ...nextStatus,
            totalScheduled: (maintenanceStatus?.totalScheduled ?? 0) + nextStatus.totalScheduled,
          };
        }
      }

      return {
        key: t.id,
        floor: t.floor,
        companyName: companyHidden ? null : t.companyName,
        companyNameRowSpan: isLinkPlaza && LINK_PLAZA_MERGE_COMPANY_NAME_DOWN.has(t.floor) ? 2 : 1,
        areaSqm: t.areaSqm != null ? Number(t.areaSqm) : null,
        segments: barHidden ? null : isLinkPlaza ? (LINK_PLAZA_FLOOR_BAR_SEGMENTS[t.floor] ?? []) : [],
        barRowSpan: isLinkPlaza && LINK_PLAZA_MERGE_BAR_DOWN.has(t.floor) ? 2 : 1,
        maintenanceStatus: maintenanceHidden ? null : maintenanceStatus,
        maintenanceStatusRowSpan: mergesMaintenanceDown ? 2 : 1,
      };
    }),
    ...(isLinkPlaza
      ? LINK_PLAZA_BASEMENT_FLOORS.map((b) => ({
          key: b.floor,
          floor: b.floor,
          companyName: "",
          areaSqm: b.areaSqm,
          segments: b.segments,
          maintenanceStatus: emptyMaintenanceStatus,
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

      <div className="mt-6">
        <TenantBuildingView
          plazaName={isLinkPlaza ? LINK_PLAZA_DISPLAY_TITLE : plaza.name}
          rows={buildingRows}
        />
      </div>
    </div>
  );
}

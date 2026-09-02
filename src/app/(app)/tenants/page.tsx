import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { canWrite } from "@/lib/permissions";
import { auth } from "@/auth";
import { getSelectedPlaza } from "@/lib/plaza";
import { ExportLink } from "@/components/export-link";
import { PrintButton } from "@/components/print-button";
import { TenantBuildingView, type BuildingFloorRow } from "@/components/tenant-building-view";
import {
  LINK_PLAZA_FLOOR_BAR_SEGMENTS,
  LINK_PLAZA_FLOOR_DISPLAY_LABELS,
  LINK_PLAZA_BASEMENT_FLOORS,
  LINK_PLAZA_DISPLAY_TITLE,
} from "@/lib/tenants/link-plaza-floor-plan";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kiracılar",
};

export default async function TenantsPage() {
  const session = await auth();
  const writable = canWrite(session?.user.role);
  const plaza = await getSelectedPlaza();

  const tenants = await prisma.tenant.findMany({
    where: { plazaId: plaza.id },
    orderBy: { sortOrder: "asc" },
  });

  const nextSortOrder = tenants.length
    ? Math.max(...tenants.map((t) => t.sortOrder)) + 1
    : 0;

  const isLinkPlaza = plaza.name === "Link Plaza";
  // Building elevation reads top floor -> ground -> basement, the reverse of the
  // Kiracılar list's own bottom-up sortOrder (ground floor first, for data entry).
  const buildingRows: BuildingFloorRow[] = [
    ...[...tenants].reverse().map((t) => ({
      key: t.id,
      floor: LINK_PLAZA_FLOOR_DISPLAY_LABELS[t.floor] ?? t.floor,
      companyName: t.companyName,
      areaSqm: t.areaSqm != null ? Number(t.areaSqm) : null,
      segments: isLinkPlaza ? (LINK_PLAZA_FLOOR_BAR_SEGMENTS[t.floor] ?? []) : [],
    })),
    ...(isLinkPlaza
      ? LINK_PLAZA_BASEMENT_FLOORS.map((b) => ({
          key: b.floor,
          floor: b.floor,
          companyName: "",
          areaSqm: b.areaSqm,
          segments: b.segments,
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

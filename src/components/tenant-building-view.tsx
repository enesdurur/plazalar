import Link from "next/link";
import type { PlanYearStats } from "@/lib/plan/stats";

export interface FloorBarSegment {
  startPct: number;
  endPct: number;
  color: "orange" | "green" | null;
  dashed?: boolean;
}

export interface BuildingFloorRow {
  key: string;
  floor: string;
  /** null = bu satırın Kiracılar hücresi bir önceki satırın rowSpan'ı ile kaplı, render edilmez. */
  companyName: string | null;
  companyNameRowSpan?: number;
  areaSqm: number | null;
  /** null = bu satırın bar hücresi bir önceki satırın rowSpan'ı ile kaplı, render edilmez. */
  segments: FloorBarSegment[] | null;
  barRowSpan?: number;
  /** null = bu kat gerçek bir kiracı kaydı değil (ör. bodrum), bakım takibi yok. */
  maintenanceStatus: PlanYearStats | null;
}

const COLOR_HEX: Record<"orange" | "green", string> = {
  orange: "#FFCC99",
  green: "#C6EFCE",
};

function formatArea(n: number) {
  return `${new Intl.NumberFormat("tr-TR").format(Math.round(n))} m²`;
}

export function TenantBuildingView({
  plazaName,
  rows,
}: {
  plazaName: string;
  rows: BuildingFloorRow[];
}) {
  return (
    <div className="overflow-x-auto border-2 border-black bg-white">
      <div className="border-b-2 border-black py-6 text-center">
        <h2 className="text-2xl font-bold text-slate-900">{plazaName}</h2>
      </div>
      <table
        className="w-full min-w-[900px] border-collapse text-sm"
        style={{ tableLayout: "fixed" }}
      >
        <colgroup>
          <col style={{ width: 152 }} />
          <col style={{ width: 220 }} />
          <col style={{ width: 128 }} />
          <col />
          <col style={{ width: 112 }} />
        </colgroup>
        <thead>
          <tr className="border-y-2 border-black">
            <th className="border-r border-black px-3 py-2 text-center text-sm font-bold italic text-slate-900 underline">
              Kat No
            </th>
            <th className="border-r border-black px-3 py-2 text-center text-sm font-bold italic text-slate-900 underline">
              Kiracılar
            </th>
            <th className="border-r border-black px-3 py-2 text-center text-sm font-bold italic text-slate-900 underline">
              Bakım Kaydı
            </th>
            <th className="px-3 py-2" />
            <th className="border-l border-black px-3 py-2 text-center text-sm font-bold italic text-slate-900 underline">
              Gerçek Alanlar
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td className="overflow-visible whitespace-nowrap border-b border-r border-black px-3 py-1 text-center font-bold text-slate-900">
                {r.floor}
              </td>
              {r.companyName !== null && (
                <td
                  rowSpan={r.companyNameRowSpan ?? 1}
                  className="overflow-visible whitespace-nowrap border-b border-r border-black px-3 py-1 text-center align-middle font-bold text-slate-900"
                >
                  {r.companyName}
                </td>
              )}
              <td className="whitespace-nowrap border-b border-r border-black px-2 py-1 text-center">
                {r.maintenanceStatus && r.maintenanceStatus.totalScheduled > 0 ? (
                  <Link
                    href="/tenant-maintenance"
                    title="Kiracı Bakımları sayfasına git"
                    className="inline-flex gap-1 text-xs font-bold hover:opacity-80"
                  >
                    <span className="text-green-700">✓{r.maintenanceStatus.done}</span>
                    <span className="text-red-700">✕{r.maintenanceStatus.missed}</span>
                    <span className="text-amber-600">●{r.maintenanceStatus.pending}</span>
                  </Link>
                ) : null}
              </td>
              {r.segments !== null && (
                <td rowSpan={r.barRowSpan ?? 1} className="relative p-0" style={{ height: 26 }}>
                  <div className="relative h-full w-full">
                    {r.segments.map((seg, i) => (
                      <div
                        key={i}
                        className={`absolute top-0.5 bottom-0.5 border ${
                          seg.dashed ? "border-dashed border-black" : "border-black"
                        }`}
                        style={{
                          left: `${seg.startPct}%`,
                          width: `${seg.endPct - seg.startPct}%`,
                          backgroundColor: seg.color ? COLOR_HEX[seg.color] : "#ffffff",
                        }}
                      />
                    ))}
                  </div>
                </td>
              )}
              <td className="whitespace-nowrap border-b border-l border-black px-3 py-1 text-center font-bold text-slate-900">
                {r.areaSqm != null ? formatArea(r.areaSqm) : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

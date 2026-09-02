export interface FloorBarSegment {
  startPct: number;
  endPct: number;
  color: "orange" | "green" | null;
}

export interface BuildingFloorRow {
  key: string;
  floor: string;
  companyName: string;
  areaSqm: number | null;
  segments: FloorBarSegment[];
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
    <div className="overflow-x-auto rounded-none border-2 border-black bg-white">
      <div className="border-b-2 border-black py-3 text-center">
        <h2 className="text-2xl font-bold text-slate-900">{plazaName}</h2>
      </div>
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="w-32 border-r border-slate-400 px-3 py-2 text-center text-sm font-bold italic text-slate-900 underline">
              Kat No
            </th>
            <th className="w-44 border-r border-slate-400 px-3 py-2 text-center text-sm font-bold italic text-slate-900 underline">
              Kiracılar
            </th>
            <th className="w-32 border-r border-slate-400 px-3 py-2 text-center text-sm font-bold italic text-slate-900 underline">
              Bakım Kaydı
            </th>
            <th className="px-3 py-2" />
            <th className="w-28 border-l border-slate-400 px-3 py-2 text-center text-sm font-bold italic text-slate-900 underline">
              Gerçek Alanlar
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-slate-400">
              <td className="border-r border-slate-400 px-3 py-1 text-center font-bold text-slate-900">
                {r.floor}
              </td>
              <td className="border-r border-slate-400 px-3 py-1 text-center font-bold text-slate-900">
                {r.companyName}
              </td>
              <td className="border-r border-slate-400 px-3 py-1" />
              <td className="relative p-0" style={{ height: 26 }}>
                <div className="relative h-full w-full">
                  {r.segments.map((seg, i) => (
                    <div
                      key={i}
                      className="absolute top-0.5 bottom-0.5 border border-slate-600"
                      style={{
                        left: `${seg.startPct}%`,
                        width: `${seg.endPct - seg.startPct}%`,
                        backgroundColor: seg.color ? COLOR_HEX[seg.color] : "#ffffff",
                      }}
                    />
                  ))}
                </div>
              </td>
              <td className="border-l border-slate-400 px-3 py-1 text-center font-bold text-slate-900">
                {r.areaSqm != null ? formatArea(r.areaSqm) : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

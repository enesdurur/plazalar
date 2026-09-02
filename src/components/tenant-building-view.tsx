export interface BuildingFloorRow {
  key: string;
  floor: string;
  companyName: string;
  areaSqm: number | null;
  barColor: "orange" | "green" | null;
}

const BAR_COLOR_STYLES = {
  orange: "border-orange-400 bg-orange-200",
  green: "border-emerald-400 bg-emerald-200",
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
  const maxArea = Math.max(1, ...rows.map((r) => r.areaSqm ?? 0));

  return (
    <div className="overflow-x-auto rounded-lg border-2 border-slate-900 bg-white">
      <div className="border-b-2 border-slate-900 py-3 text-center">
        <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900">{plazaName}</h2>
      </div>
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b-2 border-slate-900">
            <th className="w-36 border-r border-slate-300 px-3 py-2 text-left text-xs font-semibold uppercase italic text-slate-700">
              Kat No
            </th>
            <th className="w-48 border-r border-slate-300 px-3 py-2 text-center text-xs font-semibold uppercase italic text-slate-700">
              Kiracılar
            </th>
            <th className="w-28 border-r border-slate-300 px-3 py-2 text-center text-xs font-semibold uppercase italic text-slate-700">
              Bakım Kaydı
            </th>
            <th className="px-3 py-2" />
            <th className="w-28 border-l border-slate-300 px-3 py-2 text-right text-xs font-semibold uppercase italic text-slate-700">
              Gerçek Alanlar
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-slate-200">
              <td className="border-r border-slate-200 px-3 py-1.5 font-medium text-slate-900">
                {r.floor}
              </td>
              <td className="border-r border-slate-200 px-3 py-1.5 text-center text-slate-700">
                {r.companyName}
              </td>
              <td className="border-r border-slate-200 px-3 py-1.5" />
              <td className="px-3 py-1.5">
                {r.areaSqm != null && (
                  <div className="flex justify-end">
                    <div
                      className={`h-5 border ${
                        r.barColor ? BAR_COLOR_STYLES[r.barColor] : "border-slate-300 bg-white"
                      }`}
                      style={{ width: `${Math.max((r.areaSqm / maxArea) * 100, 6)}%` }}
                    />
                  </div>
                )}
              </td>
              <td className="border-l border-slate-200 px-3 py-1.5 text-right text-slate-700">
                {r.areaSqm != null ? formatArea(r.areaSqm) : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

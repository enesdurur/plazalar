import type { TcmbRates } from "@/lib/tcmb";

const ARCHIVE_URL = "https://www.tcmb.gov.tr/kurlar/kurlar_tr.html";
const TODAY_URL =
  "https://www.tcmb.gov.tr/wps/wcm/connect/tr/tcmb+tr/main+page+site+area/bugun";

function fmt(n: number | null) {
  if (n === null) return "-";
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

export function TcmbRatesCard({ rates }: { rates: TcmbRates }) {
  const hasData = rates.usdSell !== null || rates.eurSell !== null;
  if (!hasData) return null;

  return (
    <div className="w-full shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm sm:w-[420px]">
      <div className="flex items-center justify-between gap-4">
        <p className="whitespace-nowrap font-semibold text-red-600">TCMB Döviz Kurları</p>
        <table className="text-right">
          <thead>
            <tr className="text-[11px] text-slate-400">
              <th className="px-2 text-left font-normal"></th>
              <th className="px-2 font-normal">Alış</th>
              <th className="px-2 font-normal">Satış</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-2 text-left font-medium text-slate-600">USD</td>
              <td className="px-2 tabular-nums text-slate-700">{fmt(rates.usdBuy)}</td>
              <td className="px-2 font-medium tabular-nums text-slate-900">
                {fmt(rates.usdSell)}
              </td>
            </tr>
            <tr>
              <td className="px-2 text-left font-medium text-slate-600">EUR</td>
              <td className="px-2 tabular-nums text-slate-700">{fmt(rates.eurBuy)}</td>
              <td className="px-2 font-medium tabular-nums text-slate-900">
                {fmt(rates.eurSell)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-3 border-t border-slate-100 pt-1.5">
        <p className="text-[11px] text-slate-400">
          Saat başı güncellenen kurlar için{" "}
          <a
            href={ARCHIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-600 underline"
          >
            tıklayınız
          </a>
          .
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={TODAY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
          >
            Bugün
          </a>
          <a
            href={ARCHIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-red-600 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Arşiv ▶
          </a>
        </div>
      </div>
    </div>
  );
}

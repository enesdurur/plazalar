import type { TcmbRates } from "@/lib/tcmb";

const ARCHIVE_URL = "https://www.tcmb.gov.tr/kurlar/kurlar_tr.html";

function fmt(n: number | null) {
  if (n === null) return "-";
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

export function TcmbRatesCard({ rates }: { rates: TcmbRates }) {
  const hasData = rates.usdSell !== null || rates.eurSell !== null;
  if (!hasData) return null;

  return (
    <div className="w-full shrink-0 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:w-72">
      <p className="font-semibold text-red-600">TCMB Döviz Kurları</p>
      <table className="mt-3 w-full">
        <thead>
          <tr className="text-xs text-slate-400">
            <th className="text-left font-normal"></th>
            <th className="text-right font-normal">Alış</th>
            <th className="text-right font-normal">Satış</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-slate-100">
            <td className="py-2 text-left font-medium text-slate-600">USD</td>
            <td className="text-right tabular-nums text-slate-700">{fmt(rates.usdBuy)}</td>
            <td className="text-right font-medium tabular-nums text-slate-900">
              {fmt(rates.usdSell)}
            </td>
          </tr>
          <tr className="border-t border-slate-100">
            <td className="py-2 text-left font-medium text-slate-600">EUR</td>
            <td className="text-right tabular-nums text-slate-700">{fmt(rates.eurBuy)}</td>
            <td className="text-right font-medium tabular-nums text-slate-900">
              {fmt(rates.eurSell)}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-400">
        Merkez Bankası tarafından saat başı belirlenen döviz kurları için{" "}
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
      <div className="mt-3 flex items-center justify-between">
        <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white">
          Bugün
        </span>
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
  );
}

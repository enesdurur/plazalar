import Link from "next/link";

const MONTH_SHORT_NAMES = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

/** Gerçekleşen Bütçe tablosunda hangi ayların görünür kalacağını seçtiren, JS gerektirmeyen
 * (GET form) bir ay filtresi. Bir ay işareti kaldırılıp "Uygula" ile gönderilince o ay hem
 * tablodan gizlenir hem de GERÇEKLEŞEN TOPLAM/ORTALAMA ve TASLAK BÜTÇE (N AYLIK) hesabından
 * çıkar — Taslak Bütçe (Aylık) ve (Yıllık) bundan etkilenmez. */
export function MonthFilter({
  year,
  selectedMonths,
  isFiltered,
}: {
  year: number;
  selectedMonths: number[];
  isFiltered: boolean;
}) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
    >
      <input type="hidden" name="year" value={year} />
      <span className="text-sm font-medium text-slate-600">Aylar:</span>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {MONTH_SHORT_NAMES.map((name, i) => (
          <label key={name} className="flex items-center gap-1 text-xs text-slate-600">
            <input
              type="checkbox"
              name="months"
              value={i + 1}
              defaultChecked={selectedMonths.includes(i + 1)}
              className="h-3.5 w-3.5 rounded border-slate-300"
            />
            {name}
          </label>
        ))}
      </div>
      <button
        type="submit"
        className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
      >
        Uygula
      </button>
      {isFiltered && (
        <Link
          href={`/budget?year=${year}`}
          className="text-xs text-slate-500 underline hover:text-slate-700"
        >
          Filtreyi kaldır (varsayılana dön)
        </Link>
      )}
    </form>
  );
}

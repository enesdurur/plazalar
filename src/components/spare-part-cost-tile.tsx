import Link from "next/link";

const CURRENCY_LABELS: Record<string, string> = { TRY: "TL", USD: "USD", EUR: "EUR" };

export function formatCostAmount(amount: number, currency: string) {
  return `${amount.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ${CURRENCY_LABELS[currency] ?? currency}`;
}

function CostLines({ totals }: { totals: { TRY: number; USD: number; EUR: number } }) {
  return (
    <div className="mt-2 space-y-1">
      <p className="text-lg font-semibold tabular-nums text-slate-900">
        {formatCostAmount(totals.TRY, "TRY")}
      </p>
      {totals.USD > 0 && (
        <p className="text-lg font-semibold tabular-nums text-slate-900">
          {formatCostAmount(totals.USD, "USD")}
        </p>
      )}
      {totals.EUR > 0 && (
        <p className="text-lg font-semibold tabular-nums text-slate-900">
          {formatCostAmount(totals.EUR, "EUR")}
        </p>
      )}
    </div>
  );
}

/** Panel'deki bakım maliyeti kutucuğu: tek bir kart, tek bir tıklama alanı (ikisi de
 * /maintenance-costs'a gittiği için ayrı ayrı Link olmasının bir anlamı yok — ayrı olunca
 * fare üzerine gelindiğinde sadece yarısı vurgulanıp bölünmüş gibi hissettiriyordu). İçinde
 * solda bakım (işçilik/sözleşme) maliyeti, sağda 3. Firma Bakım Planı ve Periyodik (Fenni)
 * Muayene'ye girilen yedek parça maliyeti gösteriliyor. */
export function CostBreakdownTile({
  maintenanceTotals,
  sparePartTotals,
}: {
  maintenanceTotals: { TRY: number; USD: number; EUR: number };
  sparePartTotals: { TRY: number; USD: number; EUR: number };
}) {
  return (
    <Link
      href="/maintenance-costs"
      className="grid grid-cols-2 divide-x divide-slate-100 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
    >
      <div className="p-5">
        <p className="text-sm font-medium text-slate-500">Bakım Maliyetleri</p>
        <CostLines totals={maintenanceTotals} />
      </div>
      <div className="p-5">
        <p className="text-sm font-medium text-slate-500">Yedek Parça Maliyetleri</p>
        <CostLines totals={sparePartTotals} />
      </div>
    </Link>
  );
}

/** Arıza kayıtlarına girilen yedek parça maliyetlerinin toplamı — yalnızca Arıza Kayıtları'na
 * yönlendirir (3. Firma Bakım Planı / Periyodik Muayene'deki yedek parça CostBreakdownTile'da). */
export function FaultCostTile({
  totals,
}: {
  totals: { TRY: number; USD: number; EUR: number };
}) {
  return (
    <Link
      href="/records/costs"
      className="block rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-300"
    >
      <p className="text-sm font-medium text-slate-500">Arıza Maliyetleri</p>
      <CostLines totals={totals} />
    </Link>
  );
}

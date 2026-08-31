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

/** Panel'deki bakım maliyeti kutucuğu: tek bir kart, kendi içinde ikiye bölünmüş — solda
 * bakım (işçilik/sözleşme) maliyeti, sağda 3. Firma Bakım Planı ve Periyodik (Fenni)
 * Muayene'ye girilen yedek parça maliyeti. Her iki yarı da /maintenance-costs'a gider. */
export function CostBreakdownTile({
  maintenanceTotals,
  sparePartTotals,
}: {
  maintenanceTotals: { TRY: number; USD: number; EUR: number };
  sparePartTotals: { TRY: number; USD: number; EUR: number };
}) {
  return (
    <div className="grid grid-cols-2 divide-x divide-slate-100 rounded-lg border border-slate-200 bg-white">
      <Link href="/maintenance-costs" className="p-5 hover:bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Bakım Maliyetleri</p>
        <CostLines totals={maintenanceTotals} />
      </Link>
      <Link href="/maintenance-costs" className="p-5 hover:bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Yedek Parça Maliyetleri</p>
        <CostLines totals={sparePartTotals} />
      </Link>
    </div>
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

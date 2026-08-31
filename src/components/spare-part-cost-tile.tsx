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

function CostTile({
  href,
  label,
  totals,
}: {
  href: string;
  label: string;
  totals: { TRY: number; USD: number; EUR: number };
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-300"
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <CostLines totals={totals} />
    </Link>
  );
}

export function SparePartCostTile({
  totals,
}: {
  totals: { TRY: number; USD: number; EUR: number };
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">Toplam Yedek Parça Maliyeti</p>
      <CostLines totals={totals} />
      <div className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-3 text-xs">
        <Link href="/records/costs" className="text-slate-500 hover:text-slate-900 hover:underline">
          → Arıza / Bakım Kayıtları
        </Link>
        <Link
          href="/maintenance-costs"
          className="text-slate-500 hover:text-slate-900 hover:underline"
        >
          → Periyodik ve Yıllık Bakımlar
        </Link>
      </div>
    </div>
  );
}

export function MaintenanceCostTile({
  totals,
}: {
  totals: { TRY: number; USD: number; EUR: number };
}) {
  return <CostTile href="/maintenance-costs" label="Toplam Bakım Maliyeti" totals={totals} />;
}

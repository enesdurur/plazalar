import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canWrite } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { fetchBudgetSections } from "@/lib/budget/fetch";
import { toggleConfirmed, setManualAmount } from "../actions";
import type { RawLineItem, RawSection } from "@/lib/budget/calc";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bütçe Veri Girişi",
};

const MONTHS = [
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

export default async function BudgetEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const year = params.year ? parseInt(params.year, 10) : new Date().getFullYear();

  const session = await auth();
  const writable = canWrite(session?.user.role);
  if (!writable) redirect("/budget");

  const plaza = await getSelectedPlaza();
  const sections = await fetchBudgetSections(plaza.id, year);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/budget?year=${year}`} className="text-sm text-slate-500 hover:text-slate-700">
            ← Gerçekleşen Bütçe
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">Bütçe Veri Girişi ({year})</h1>
          <p className="mt-1 text-sm text-slate-500">
            Sabit sözleşmeli kalemlerde ayı işaretleyin, tutar otomatik gelir. Diğer kalemlerde
            tutarı elle girin.
          </p>
        </div>
        <Link
          href={`/budget/setup?year=${year}`}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Kalemleri Yönet
        </Link>
      </div>

      {sections.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">{year} yılı için henüz gider kalemi yok.</p>
          <Link
            href={`/budget/setup?year=${year}`}
            className="mt-3 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Kalemleri Tanımla
          </Link>
        </div>
      )}

      {sections.map((section) => (
        <SectionMatrix key={section.name} section={section} />
      ))}
    </div>
  );
}

function SectionMatrix({ section }: { section: RawSection }) {
  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold text-slate-900">{section.name}</h2>
      <div className="mt-3 max-h-[60vh] overflow-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="sticky top-0 z-20 bg-slate-50">
            <tr>
              <th className="sticky left-0 z-10 min-w-[220px] bg-slate-50 px-4 py-3 text-left font-medium text-slate-600">
                Kalem
              </th>
              {MONTHS.map((m) => (
                <th key={m} className="px-2 py-3 text-center font-medium text-slate-600">
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {section.items.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
            {section.items.length === 0 && (
              <tr>
                <td colSpan={13} className="px-4 py-6 text-center text-slate-500">
                  Bu bölümde henüz kalem yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ItemRow({ item }: { item: RawLineItem }) {
  const entryByMonth = new Map(item.entries.map((e) => [e.month, e]));

  return (
    <tr className="hover:bg-slate-50">
      <td className="sticky left-0 z-10 bg-white px-4 py-2">
        <p className="font-medium text-slate-900">{item.label}</p>
        <p className="text-xs text-slate-400">
          {item.isFixedContract
            ? `Sabit: ${Number(item.fixedAmount ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`
            : "Elle girilir"}
        </p>
      </td>
      {MONTHS.map((_, i) => {
        const month = i + 1;
        const entry = entryByMonth.get(month);
        return (
          <td key={month} className="px-2 py-2 text-center">
            {item.isFixedContract ? (
              <FixedCell itemId={item.id} month={month} confirmed={entry?.confirmed ?? false} />
            ) : (
              <ManualCell
                itemId={item.id}
                month={month}
                amount={entry?.manualAmount ?? null}
              />
            )}
          </td>
        );
      })}
    </tr>
  );
}

function FixedCell({
  itemId,
  month,
  confirmed,
}: {
  itemId: string;
  month: number;
  confirmed: boolean;
}) {
  return (
    <form action={toggleConfirmed.bind(null, itemId, month)}>
      <button
        type="submit"
        aria-label={confirmed ? "Onayı kaldır" : "Onayla"}
        className={`inline-flex h-7 w-7 items-center justify-center rounded font-medium transition-colors ${
          confirmed
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-slate-50 text-slate-300 hover:bg-slate-100"
        }`}
      >
        {confirmed ? "✓" : ""}
      </button>
    </form>
  );
}

function ManualCell({
  itemId,
  month,
  amount,
}: {
  itemId: string;
  month: number;
  amount: number | null;
}) {
  return (
    <form action={setManualAmount.bind(null, itemId, month)} className="flex items-center gap-1">
      <input
        type="number"
        step="0.01"
        min="0"
        name="amount"
        defaultValue={amount ?? ""}
        placeholder="-"
        className="w-20 rounded border border-slate-200 px-1.5 py-1 text-right text-xs focus:border-slate-400 focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Kaydet"
        className="rounded px-1 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        ✓
      </button>
    </form>
  );
}

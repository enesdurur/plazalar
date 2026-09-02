import Link from "next/link";
import { auth } from "@/auth";
import { canWrite } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { fetchBudgetSections, hasBudgetData } from "@/lib/budget/fetch";
import { computeLinkPlazaBudget } from "@/lib/budget/calc";
import { BudgetView } from "./budget-view";
import { MonthFilter } from "./month-filter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gerçekleşen Bütçe",
};

/** "?months=1&months=3&months=4" gibi tekrar eden query param'ları 1-12 arası, tekilleştirilmiş
 * ve sıralı bir ay listesine çevirir. Geçersiz/boşsa undefined döner (filtre yok demektir). */
function parseSelectedMonths(raw: string | string[] | undefined): number[] | undefined {
  if (!raw) return undefined;
  const values = Array.isArray(raw) ? raw : [raw];
  const months = values
    .map((v) => parseInt(v, 10))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 12);
  const unique = Array.from(new Set(months)).sort((a, b) => a - b);
  return unique.length > 0 ? unique : undefined;
}

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; months?: string | string[] }>;
}) {
  const params = await searchParams;
  const year = params.year ? parseInt(params.year, 10) : new Date().getFullYear();
  const requestedMonths = parseSelectedMonths(params.months);
  const isFiltered = requestedMonths !== undefined;

  const session = await auth();
  const writable = canWrite(session?.user.role);
  const plaza = await getSelectedPlaza();
  const hasData = await hasBudgetData(plaza.id, year);
  const budget = hasData
    ? computeLinkPlazaBudget(await fetchBudgetSections(plaza.id, year), year, undefined, requestedMonths)
    : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Gerçekleşen Bütçe</h1>
          <p className="mt-1 text-sm text-slate-500">
            {hasData
              ? `${year} yılı aylık gerçekleşen giderler ve taslak bütçe karşılaştırması.`
              : `${plaza.name} için ${year} yılında henüz bütçe verisi girilmedi.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/budget?year=${year - 1}`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            ← {year - 1}
          </Link>
          <span className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white">
            {year}
          </span>
          <Link
            href={`/budget?year=${year + 1}`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            {year + 1} →
          </Link>
          {writable && (
            <>
              <Link
                href={`/budget/entry?year=${year}`}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Veri Girişi
              </Link>
              <Link
                href={`/budget/setup?year=${year}`}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Kalemleri Yönet
              </Link>
            </>
          )}
        </div>
      </div>

      {hasData && budget ? (
        <div className="mt-6">
          <MonthFilter year={year} selectedMonths={budget.selectedMonths} isFiltered={isFiltered} />
          <div className="mt-4">
            <BudgetView budget={budget} />
          </div>
        </div>
      ) : (
        writable && (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">
              {year} yılı için henüz gider kalemi tanımlanmadı.
            </p>
            <Link
              href={`/budget/setup?year=${year}`}
              className="mt-3 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Kalemleri Tanımla
            </Link>
          </div>
        )
      )}
    </div>
  );
}

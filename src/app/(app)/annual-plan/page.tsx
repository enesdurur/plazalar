import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { togglePlanEntry } from "./actions";

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

const CELL_STYLES = {
  DONE: "bg-green-100 text-green-700 hover:bg-green-200",
  MISSED: "bg-red-100 text-red-700 hover:bg-red-200",
  EMPTY: "bg-slate-50 text-slate-300 hover:bg-slate-100",
};

export default async function AnnualPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const year = params.year ? parseInt(params.year, 10) : new Date().getFullYear();

  const session = await auth();
  const writable = canWrite(session?.user.role);
  const plaza = await getSelectedPlaza();

  const [machines, entries] = await Promise.all([
    prisma.machine.findMany({ where: { plazaId: plaza.id }, orderBy: { name: "asc" } }),
    prisma.maintenancePlanEntry.findMany({
      where: { year, machine: { plazaId: plaza.id } },
    }),
  ]);

  const entryMap = new Map(entries.map((e) => [`${e.machineId}-${e.month}`, e.completed]));

  const monthlyDone = Array(12).fill(0);
  const monthlyMissed = Array(12).fill(0);
  for (const e of entries) {
    if (e.completed === true) monthlyDone[e.month - 1]++;
    if (e.completed === false) monthlyMissed[e.month - 1]++;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Yıllık Bakım Planı</h1>
          <p className="mt-1 text-sm text-slate-500">
            Her hücreye tıklayarak durumu değiştirin: boş → yapıldı → yapılmadı → boş.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/annual-plan?year=${year - 1}`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            ← {year - 1}
          </Link>
          <span className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white">
            {year}
          </span>
          <Link
            href={`/annual-plan?year=${year + 1}`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            {year + 1} →
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="sticky left-0 bg-slate-50 px-4 py-3 text-left font-medium text-slate-600">
                Makine
              </th>
              {MONTHS.map((m) => (
                <th key={m} className="px-2 py-3 text-center font-medium text-slate-600">
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {machines.map((machine) => (
              <tr key={machine.id} className="hover:bg-slate-50">
                <td className="sticky left-0 bg-white px-4 py-2 font-medium text-slate-900">
                  {machine.name}
                </td>
                {MONTHS.map((_, i) => {
                  const month = i + 1;
                  const completed = entryMap.get(`${machine.id}-${month}`);
                  const style =
                    completed === true
                      ? CELL_STYLES.DONE
                      : completed === false
                        ? CELL_STYLES.MISSED
                        : CELL_STYLES.EMPTY;
                  const label = completed === true ? "✓" : completed === false ? "✕" : "";

                  if (!writable) {
                    return (
                      <td key={month} className="px-2 py-2 text-center">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded ${style}`}
                        >
                          {label}
                        </span>
                      </td>
                    );
                  }

                  return (
                    <td key={month} className="px-2 py-2 text-center">
                      <form
                        action={togglePlanEntry.bind(null, machine.id, year, month)}
                      >
                        <button
                          type="submit"
                          className={`inline-flex h-7 w-7 items-center justify-center rounded font-medium transition-colors ${style}`}
                        >
                          {label}
                        </button>
                      </form>
                    </td>
                  );
                })}
              </tr>
            ))}
            {machines.length === 0 && (
              <tr>
                <td colSpan={13} className="px-4 py-8 text-center text-slate-500">
                  Henüz makine kaydı yok.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-slate-50">
            <tr>
              <td className="sticky left-0 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500">
                Yapıldı / Yapılmadı
              </td>
              {MONTHS.map((_, i) => (
                <td key={i} className="px-2 py-2 text-center text-xs text-slate-500">
                  {monthlyDone[i]} / {monthlyMissed[i]}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

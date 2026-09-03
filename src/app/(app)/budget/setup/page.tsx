import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { fetchBudgetSections } from "@/lib/budget/fetch";
import { deleteLineItem } from "../actions";
import { DeleteButton } from "@/components/delete-button";
import type { RawSection } from "@/lib/budget/calc";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bütçe Kalemleri",
};

const SECTIONS = [
  "A- PERSONEL GİDERLERİ",
  "YÖNETİM GİDERLERİ",
  "DİĞER GİDERLER",
] as const;

export default async function BudgetSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const year = params.year ? parseInt(params.year, 10) : new Date().getFullYear();

  const session = await auth();
  const writable = canWrite(session?.user.role);
  const deletable = canDelete(session?.user.role);
  if (!writable) redirect("/budget");

  const plaza = await getSelectedPlaza();
  const sections = await fetchBudgetSections(plaza.id, year);
  const byName = new Map(sections.map((s) => [s.name, s]));

  return (
    <div>
      <Link href={`/budget?year=${year}`} className="text-sm text-slate-500 hover:text-slate-700">
        ← Gerçekleşen Bütçe
      </Link>
      <h1 className="mt-1 text-xl font-semibold text-slate-900">Bütçe Kalemleri ({year})</h1>
      <p className="mt-1 text-sm text-slate-500">
        Her bölüme yıl başında kalemleri tanımlayın. Personel/Yönetim Giderleri kalemlerinin
        aylık gerçekleşen tutarlarını{" "}
        <Link href={`/budget/entry?year=${year}`} className="underline">
          Veri Girişi
        </Link>
        , Diğer Giderler kalemlerini ise{" "}
        <Link href="/other-expenses" className="underline">
          Diğer Giderler
        </Link>{" "}
        sayfasından (fatura/belge + onay ile) işleyin.
      </p>

      {SECTIONS.map((name) => (
        <SectionBlock
          key={name}
          name={name}
          section={byName.get(name)}
          year={year}
          deletable={deletable}
        />
      ))}
    </div>
  );
}

function SectionBlock({
  name,
  section,
  year,
  deletable,
}: {
  name: string;
  section: RawSection | undefined;
  year: number;
  deletable: boolean;
}) {
  const items = section?.items ?? [];

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{name}</h2>
        <Link
          href={`/budget/setup/new?section=${encodeURIComponent(name)}&year=${year}`}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Yeni Kalem
        </Link>
      </div>
      <div className="mt-3 overflow-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Kategori</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Kalem</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Aylık Taslak Bütçe</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Tür</th>
              <th className="px-4 py-3 print:hidden" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-slate-100">
                <td className="px-4 py-3 text-slate-600">{item.category ?? "-"}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{item.label}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-900">
                  {item.monthlyBudget.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  TL
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {item.isFixedContract ? (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      Sabit sözleşme
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      Elle giriş
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/budget/setup/${item.id}/edit?year=${year}`}
                      className="text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                      Düzenle
                    </Link>
                    {deletable && <DeleteButton action={deleteLineItem.bind(null, item.id)} />}
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
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

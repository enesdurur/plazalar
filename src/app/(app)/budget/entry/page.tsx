import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canWrite } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { fetchBudgetSections } from "@/lib/budget/fetch";
import { toggleConfirmed, setManualAmount } from "../actions";
import { allowsAdjustments, isLockedMonth, type RawLineItem, type RawSection } from "@/lib/budget/calc";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bütçe Veri Girişi",
};

const AUTO_SOURCE_LABELS: Record<string, string> = {
  MAINTENANCE_PLAN: "3. Firma Bakım Planı",
  INSPECTION: "Periyodik (Fenni) Muayene",
  FAULT_RECORDS: "Arıza Kayıtları",
};

const AUTO_SOURCE_HREFS: Record<string, string> = {
  MAINTENANCE_PLAN: "/annual-plan",
  INSPECTION: "/inspections",
  FAULT_RECORDS: "/records",
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

// Her bölüm (Personel/Yönetim/Diğer Giderler) kendi <table>'ında ayrı ayrı otomatik sütun
// genişliği hesaplarsa, aylar bölümden bölüme kayar (Ocak sütunu bir altta farklı x'te başlar).
// Sabit ve ortak sütun genişlikleriyle (tableLayout: fixed + aynı colgroup) tüm bölümlerdeki
// ay sütunları sayfa boyunca aynı hizada, alt alta gelir.
const KALEM_W = 240;
const MONTH_W = 128;

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
            tutarı elle girin. Ocak-Haziran 2026 Excel&apos;den aktarılan geçmiş veridir, artık
            düzenlenemez.
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
        <SectionMatrix key={section.name} section={section} year={year} />
      ))}
    </div>
  );
}

function SectionMatrix({ section, year }: { section: RawSection; year: number }) {
  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold text-slate-900">{section.name}</h2>
      <div className="mt-3 max-h-[60vh] overflow-auto rounded-lg border border-slate-200 bg-white">
        <table
          className="divide-y divide-slate-200 text-sm"
          style={{ tableLayout: "fixed", width: KALEM_W + MONTHS.length * MONTH_W }}
        >
          <colgroup>
            <col style={{ width: KALEM_W }} />
            {MONTHS.map((m) => (
              <col key={m} style={{ width: MONTH_W }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-20 bg-slate-50">
            <tr>
              <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left font-medium text-slate-600">
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
              <ItemRow key={item.id} item={item} year={year} />
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

function ItemRow({ item, year }: { item: RawLineItem; year: number }) {
  const entryByMonth = new Map(item.entries.map((e) => [e.month, e]));

  return (
    <tr className="hover:bg-slate-50">
      <td className="sticky left-0 z-10 bg-white px-4 py-2">
        <p className="font-medium text-slate-900">{item.label}</p>
        <p className="text-xs text-slate-400">
          {item.autoSource
            ? `Otomatik: ${AUTO_SOURCE_LABELS[item.autoSource]}`
            : item.isFixedContract
              ? `Sabit: ${Number(item.fixedAmount ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`
              : "Elle girilir"}
        </p>
      </td>
      {MONTHS.map((_, i) => {
        const month = i + 1;
        const entry = entryByMonth.get(month);
        const monthAdjustments = item.adjustments.filter((a) => a.month === month);

        if (isLockedMonth(year, month)) {
          return (
            <td key={month} className="px-2 py-2 text-center">
              <LockedCell amount={entry?.manualAmount ?? null} />
            </td>
          );
        }

        if (item.autoSource) {
          return (
            <td key={month} className="px-2 py-2 text-center">
              <AutoCell amount={entry?.manualAmount ?? null} href={AUTO_SOURCE_HREFS[item.autoSource]} />
            </td>
          );
        }

        // Bu ay için zaten elle girilmiş bir tutar varsa (kalem sonradan sabit sözleşmeli
        // yapılmış olsa bile) o tutarı elle-giriş hücresi olarak göstermeye devam ederiz —
        // sabit işaretlemek geçmiş ayların verisini gizlemez/sıfırlamaz. Onay kutusu sadece
        // henüz tutar girilmemiş aylarda görünür.
        const hasManualValue = entry?.manualAmount != null;
        return (
          <td key={month} className="px-2 py-2 text-center">
            {item.isFixedContract && !hasManualValue ? (
              <FixedCell itemId={item.id} month={month} confirmed={entry?.confirmed ?? false} />
            ) : (
              <ManualCell
                itemId={item.id}
                month={month}
                amount={entry?.manualAmount ?? null}
              />
            )}
            {allowsAdjustments(item.category) && (
              <AdjustmentLink itemId={item.id} month={month} adjustments={monthAdjustments} />
            )}
          </td>
        );
      })}
    </tr>
  );
}

function AdjustmentLink({
  itemId,
  month,
  adjustments,
}: {
  itemId: string;
  month: number;
  adjustments: RawLineItem["adjustments"];
}) {
  if (adjustments.length === 0) {
    return (
      <Link
        href={`/budget/entry/adjustments/${itemId}/${month}`}
        className="mt-0.5 block whitespace-nowrap text-[10px] text-slate-300 hover:text-slate-600"
      >
        + kırılım
      </Link>
    );
  }

  const net = adjustments.reduce(
    (sum, a) => sum + (a.type === "OVERTIME" ? a.amount : -a.amount),
    0
  );
  return (
    <Link
      href={`/budget/entry/adjustments/${itemId}/${month}`}
      className={`mt-0.5 block whitespace-nowrap text-[10px] font-medium hover:underline ${
        net >= 0 ? "text-blue-600" : "text-red-600"
      }`}
    >
      {net >= 0 ? "+" : ""}
      {net.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ({adjustments.length})
    </Link>
  );
}

function LockedCell({ amount }: { amount: number | null }) {
  return (
    <span className="inline-block w-20 text-right text-xs text-slate-400" title="Geçmiş veri, düzenlenemez">
      {amount != null
        ? amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "-"}
    </span>
  );
}

function AutoCell({ amount, href }: { amount: number | null; href: string }) {
  return (
    <Link
      href={href}
      title="Otomatik hesaplanır, kaynağı görmek için tıklayın"
      className="inline-block w-20 text-right text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline"
    >
      {amount != null
        ? amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "-"}
    </Link>
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

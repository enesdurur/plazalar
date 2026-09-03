import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { selectPlaza } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plaza Seç",
};

export const dynamic = "force-dynamic";

const PLAZA_ORDER = [
  "Square Plaza",
  "Link Plaza",
  "Olive Plaza",
  "DLP No.1 Plaza",
  "Maslak No.19",
  "Maslak No.23-25 Plaza",
  "Uso Center",
  "Fındıklı Abisa Plaza",
];

export default async function SelectPlazaPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const plazas = await prisma.plaza.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  });

  plazas.sort((a, b) => {
    const ai = PLAZA_ORDER.indexOf(a.name);
    const bi = PLAZA_ORDER.indexOf(b.name);
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <Link
          href="/select-company"
          className="text-xs text-slate-400 underline hover:text-slate-600"
        >
          ← Şirket seçimine dön
        </Link>
        <h1 className="mt-3 text-xl font-semibold text-slate-900">Hangi plazaya girmek istiyorsunuz?</h1>
        <p className="mt-1 text-sm text-slate-500">
          Devam etmek için bir plaza seçin.
        </p>

        <div className="mt-6 space-y-2">
          {plazas.map((plaza) => (
            <form key={plaza.id} action={selectPlaza.bind(null, plaza.id)}>
              <button
                type="submit"
                className="w-full rounded-md border border-slate-200 px-4 py-3 text-left text-sm font-bold uppercase text-slate-900 hover:border-slate-400 hover:bg-slate-50"
              >
                {plaza.name}
              </button>
            </form>
          ))}
          {plazas.length === 0 && (
            <p className="text-sm text-slate-500">Henüz plaza tanımlı değil.</p>
          )}
        </div>
      </div>
    </div>
  );
}

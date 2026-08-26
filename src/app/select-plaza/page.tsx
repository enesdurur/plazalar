import { prisma } from "@/lib/prisma";
import { selectPlaza } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plaza Seç",
};

export const dynamic = "force-dynamic";

export default async function SelectPlazaPage() {
  const plazas = await prisma.plaza.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Hangi plazaya girmek istiyorsunuz?</h1>
        <p className="mt-1 text-sm text-slate-500">
          Devam etmek için bir plaza seçin.
        </p>

        <div className="mt-6 space-y-2">
          {plazas.map((plaza) => (
            <form key={plaza.id} action={selectPlaza.bind(null, plaza.id)}>
              <button
                type="submit"
                className="w-full rounded-md border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-900 hover:border-slate-400 hover:bg-slate-50"
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

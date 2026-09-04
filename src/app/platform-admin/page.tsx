import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManagePlatform } from "@/lib/permissions";
import { LogoutButton } from "@/components/logout-button";
import { createOrganization } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platform Admin",
};

export const dynamic = "force-dynamic";

export default async function PlatformAdminPage() {
  const session = await auth();
  if (!session?.user || !canManagePlatform(session.user)) {
    redirect("/");
  }

  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { users: true, plazas: true } },
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between bg-slate-900 px-4 py-3 md:px-8">
        <div>
          <p className="text-sm font-semibold text-white">Platform Admin</p>
          <p className="text-xs text-slate-400">Yeni müşteri organizasyonu açma</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Uygulamaya Dön
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="p-4 md:p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Organizasyonlar</h2>
            <p className="mt-1 text-sm text-slate-500">Toplam {organizations.length} organizasyon.</p>
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Ad</th>
                    <th className="px-4 py-2">Slug</th>
                    <th className="px-4 py-2 text-right">Kullanıcı</th>
                    <th className="px-4 py-2 text-right">Plaza</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {organizations.map((org) => (
                    <tr key={org.id}>
                      <td className="px-4 py-2 font-medium text-slate-900">{org.name}</td>
                      <td className="px-4 py-2 text-slate-500">{org.slug ?? "—"}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                        {org._count.users}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                        {org._count.plazas}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">Yeni Organizasyon Aç</h2>
            <p className="mt-1 text-sm text-slate-500">
              Yeni bir müşteri organizasyonu, ilk yönetici kullanıcısı ve isteğe bağlı ilk
              plazasını oluşturur.
            </p>
            <form action={createOrganization} className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
              <div>
                <label className="block text-sm font-medium text-slate-700">Organizasyon Adı</label>
                <input
                  name="orgName"
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="ör. Örnek Gayrimenkul"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Slug (opsiyonel)</label>
                <input
                  name="orgSlug"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="ör. ornek-gayrimenkul"
                />
              </div>
              <div className="border-t border-slate-200 pt-4">
                <p className="text-sm font-medium text-slate-700">İlk Yönetici Kullanıcı</p>
                <div className="mt-2 space-y-3">
                  <input
                    name="adminName"
                    required
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Ad Soyad"
                  />
                  <input
                    name="adminEmail"
                    type="email"
                    required
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="E-posta"
                  />
                  <input
                    name="adminPassword"
                    type="password"
                    required
                    minLength={6}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Şifre (en az 6 karakter)"
                  />
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <label className="block text-sm font-medium text-slate-700">İlk Plaza (opsiyonel)</label>
                <input
                  name="plazaName"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="ör. Merkez Bina"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Organizasyon Oluştur
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

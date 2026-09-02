import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CompanySelector } from "@/components/company-selector";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Şirket Seç",
};

export const dynamic = "force-dynamic";

export default async function SelectCompanyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Hangi şirketle devam etmek istiyorsunuz?</h1>
        <p className="mt-1 text-sm text-slate-500">Devam etmek için bir şirket seçin.</p>

        <div className="mt-6">
          <CompanySelector />
        </div>
      </div>
    </div>
  );
}

import { LoginForm } from "./login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giriş Yap",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Plazalar Teknik Hizmetler</h1>
        <p className="mt-1 text-sm text-slate-500">
          Bakım &amp; Arıza Yönetim Sistemine giriş yapın
        </p>
        <LoginForm callbackUrl={params.callbackUrl} hasError={!!params.error} />
      </div>
    </div>
  );
}

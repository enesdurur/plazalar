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

  return <CompanySelector />;
}

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canWrite } from "@/lib/permissions";
import { LineItemForm } from "../line-item-form";
import { createLineItem } from "../../actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yeni Bütçe Kalemi",
};

const VALID_SECTIONS = ["A- PERSONEL GİDERLERİ", "YÖNETİM GİDERLERİ", "DİĞER GİDERLER"] as const;

export default async function NewLineItemPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; year?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !canWrite(session.user.role)) {
    redirect("/budget");
  }

  const params = await searchParams;
  const year = params.year ? parseInt(params.year, 10) : new Date().getFullYear();
  const section = VALID_SECTIONS.find((s) => s === params.section) ?? VALID_SECTIONS[0];

  const action = createLineItem.bind(null, section, year);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Yeni Bütçe Kalemi</h1>
      <p className="mt-1 text-sm text-slate-500">{section}</p>
      <div className="mt-6">
        <LineItemForm action={action} />
      </div>
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { LineItemForm } from "../../line-item-form";
import { updateLineItem } from "../../../actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bütçe Kalemi Düzenle",
};

export default async function EditLineItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !canWrite(session.user.role)) {
    redirect("/budget");
  }

  const { id } = await params;
  const sp = await searchParams;
  const year = sp.year ? parseInt(sp.year, 10) : new Date().getFullYear();
  const plaza = await getSelectedPlaza();

  const item = await prisma.budgetLineItem.findFirst({
    where: { id, section: { plazaId: plaza.id } },
    include: { section: true },
  });
  if (!item) notFound();

  const action = updateLineItem.bind(null, id, year);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Bütçe Kalemi Düzenle</h1>
      <p className="mt-1 text-sm text-slate-500">{item.section.name}</p>
      <div className="mt-6">
        <LineItemForm
          action={action}
          defaults={{
            category: item.category,
            label: item.label,
            monthlyBudget: Number(item.monthlyBudget),
            isFixedContract: item.isFixedContract,
            fixedAmount: item.fixedAmount != null ? Number(item.fixedAmount) : null,
            autoSource: item.autoSource,
          }}
        />
      </div>
    </div>
  );
}

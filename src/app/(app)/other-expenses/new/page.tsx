import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { SECTION_NAMES } from "@/lib/budget/calc";
import { OtherExpenseForm } from "../other-expense-form";
import { createOtherExpense } from "../actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yeni Diğer Gider Kaydı",
};

export default async function NewOtherExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !canWrite(session.user.role)) {
    redirect("/other-expenses");
  }

  const params = await searchParams;
  const year = params.year ? parseInt(params.year, 10) : new Date().getFullYear();
  const plaza = await getSelectedPlaza();

  const section = await prisma.budgetSection.findFirst({
    where: { plazaId: plaza.id, year, name: SECTION_NAMES.other },
    include: { items: { orderBy: { sortOrder: "asc" }, select: { id: true, label: true } } },
  });
  const lineItems = section?.items ?? [];

  if (lineItems.length === 0) {
    redirect(`/budget/setup?year=${year}`);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Yeni Diğer Gider Kaydı ({year})</h1>
      <div className="mt-6">
        <OtherExpenseForm action={createOtherExpense} lineItems={lineItems} />
      </div>
    </div>
  );
}

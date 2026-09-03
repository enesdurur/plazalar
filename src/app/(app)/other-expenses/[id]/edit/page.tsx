import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";
import { SECTION_NAMES } from "@/lib/budget/calc";
import { OtherExpenseForm } from "../../other-expense-form";
import { updateOtherExpense } from "../../actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diğer Gider Kaydını Düzenle",
};

export default async function EditOtherExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || !canWrite(session.user.role)) {
    redirect("/other-expenses");
  }

  const { id } = await params;
  const plaza = await getSelectedPlaza();

  const entry = await prisma.otherExpenseEntry.findFirst({
    where: { id, lineItem: { section: { plazaId: plaza.id } } },
    include: { lineItem: { include: { section: true } } },
  });
  if (!entry) notFound();

  const section = await prisma.budgetSection.findFirst({
    where: { plazaId: plaza.id, year: entry.lineItem.section.year, name: SECTION_NAMES.other },
    include: {
      items: {
        where: { autoSource: null },
        orderBy: { sortOrder: "asc" },
        select: { id: true, label: true },
      },
    },
  });
  const lineItems = section?.items ?? [];

  const action = updateOtherExpense.bind(null, id);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Diğer Gider Kaydını Düzenle</h1>
      <div className="mt-6">
        <OtherExpenseForm
          action={action}
          lineItems={lineItems}
          defaults={{
            lineItemId: entry.lineItemId,
            month: entry.month,
            amount: Number(entry.amount),
            note: entry.note,
          }}
        />
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import type { RawSection } from "./calc";

export async function fetchBudgetSections(plazaId: string, year: number): Promise<RawSection[]> {
  const sections = await prisma.budgetSection.findMany({
    where: { plazaId, year },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: { entries: true },
      },
    },
  });

  return sections.map((s) => ({
    name: s.name,
    items: s.items.map((item) => ({
      id: item.id,
      category: item.category,
      label: item.label,
      monthlyBudget: Number(item.monthlyBudget),
      isFixedContract: item.isFixedContract,
      fixedAmount: item.fixedAmount != null ? Number(item.fixedAmount) : null,
      fill: item.fill,
      entries: item.entries.map((e) => ({
        month: e.month,
        confirmed: e.confirmed,
        manualAmount: e.manualAmount != null ? Number(e.manualAmount) : null,
      })),
    })),
  }));
}

export async function hasBudgetData(plazaId: string, year: number): Promise<boolean> {
  const count = await prisma.budgetSection.count({ where: { plazaId, year } });
  return count > 0;
}

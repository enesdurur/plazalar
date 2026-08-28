import { getSelectedPlaza } from "@/lib/plaza";
import { LINK_PLAZA_BUDGET_2026 } from "@/lib/budget/link-plaza-2026";
import { computeLinkPlazaBudget } from "@/lib/budget/calc";
import { BudgetView } from "./budget-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gerçekleşen Bütçe",
};

export default async function BudgetPage() {
  const plaza = await getSelectedPlaza();
  const hasData = plaza.name === "Link Plaza";

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Gerçekleşen Bütçe</h1>
      <p className="mt-1 text-sm text-slate-500">
        {hasData
          ? "2026 yılı aylık gerçekleşen giderler ve taslak bütçe karşılaştırması."
          : `${plaza.name} için henüz bütçe verisi girilmedi.`}
      </p>

      {hasData && (
        <div className="mt-6">
          <BudgetView budget={computeLinkPlazaBudget(LINK_PLAZA_BUDGET_2026)} />
        </div>
      )}
    </div>
  );
}

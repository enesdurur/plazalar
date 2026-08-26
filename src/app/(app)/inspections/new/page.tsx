import { InspectionForm } from "../inspection-form";
import { createInspection } from "../actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yeni Muayene Kaydı",
};

export default function NewInspectionPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Yeni Periyodik Muayene Kaydı</h1>
      <div className="mt-6">
        <InspectionForm action={createInspection} />
      </div>
    </div>
  );
}

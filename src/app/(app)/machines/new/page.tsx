import { MachineForm } from "../machine-form";
import { createMachine } from "../actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yeni Makine",
};

export default async function NewMachinePage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Yeni Makine Ekle</h1>
      <div className="mt-6">
        <MachineForm action={createMachine} />
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { MachineForm } from "../machine-form";
import { createMachine } from "../actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yeni Makine",
};

export default async function NewMachinePage() {
  const lines = await prisma.line.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Yeni Makine Ekle</h1>
      <div className="mt-6">
        <MachineForm action={createMachine} lines={lines} />
      </div>
    </div>
  );
}

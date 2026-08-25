"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";

export async function togglePlanEntry(machineId: string, year: number, month: number) {
  const session = await auth();
  if (!session?.user || !canWrite(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  const plaza = await getSelectedPlaza();
  const machine = await prisma.machine.findFirst({
    where: { id: machineId, plazaId: plaza.id },
  });
  if (!machine) throw new Error("Makine bu plazaya ait değil.");

  const existing = await prisma.maintenancePlanEntry.findUnique({
    where: { machineId_year_month: { machineId, year, month } },
  });

  // Cycle: boş (null) -> yapıldı (true) -> yapılmadı (false) -> boş (null)
  const next = existing?.completed === true ? false : existing?.completed === false ? null : true;

  await prisma.maintenancePlanEntry.upsert({
    where: { machineId_year_month: { machineId, year, month } },
    update: { completed: next },
    create: { machineId, year, month, completed: next },
  });

  revalidatePath("/annual-plan");
}

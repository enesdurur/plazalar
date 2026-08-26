"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";

const machineSchema = z.object({
  name: z.string().min(1, "Makine adı zorunludur"),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNo: z.string().optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  feature: z.string().optional(),
  powerKw: z.coerce.number().optional(),
  location: z.string().optional(),
  distributionPanel: z.string().optional(),
  mccPanel: z.string().optional(),
});

function emptyToUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

function parseMachineForm(formData: FormData) {
  return machineSchema.parse({
    name: formData.get("name"),
    brand: emptyToUndefined(formData.get("brand")),
    model: emptyToUndefined(formData.get("model")),
    serialNo: emptyToUndefined(formData.get("serialNo")),
    quantity: formData.get("quantity") || 1,
    feature: emptyToUndefined(formData.get("feature")),
    powerKw: emptyToUndefined(formData.get("powerKw")),
    location: emptyToUndefined(formData.get("location")),
    distributionPanel: emptyToUndefined(formData.get("distributionPanel")),
    mccPanel: emptyToUndefined(formData.get("mccPanel")),
  });
}

async function requireWriteAccess() {
  const session = await auth();
  if (!session?.user || !canWrite(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  return session;
}

export async function createMachine(formData: FormData) {
  await requireWriteAccess();
  const plaza = await getSelectedPlaza();
  const data = parseMachineForm(formData);

  await prisma.machine.create({ data: { ...data, plazaId: plaza.id } });

  revalidatePath("/machines");
  redirect("/machines");
}

export async function updateMachine(id: string, formData: FormData) {
  await requireWriteAccess();
  const plaza = await getSelectedPlaza();
  const data = parseMachineForm(formData);

  await prisma.machine.updateMany({ where: { id, plazaId: plaza.id }, data });

  revalidatePath("/machines");
  redirect("/machines");
}

export async function deleteMachine(id: string) {
  const session = await auth();
  if (!session?.user || !canDelete(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  const plaza = await getSelectedPlaza();

  await prisma.machine.deleteMany({ where: { id, plazaId: plaza.id } });
  revalidatePath("/machines");
}

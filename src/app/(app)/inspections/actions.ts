"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";

const schema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Ekipman adı zorunludur"),
  brand: z.string().optional(),
  reportNo: z.coerce.number().int().optional(),
  period: z.string().optional(),
  technicalFeature: z.string().optional(),
  inspectionDate: z.string().optional(),
  nextInspectionDate: z.string().optional(),
  location: z.string().optional(),
  responsiblePerson: z.string().optional(),
});

function emptyToUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

function parseForm(formData: FormData) {
  const parsed = schema.parse({
    code: emptyToUndefined(formData.get("code")),
    name: formData.get("name"),
    brand: emptyToUndefined(formData.get("brand")),
    reportNo: emptyToUndefined(formData.get("reportNo")),
    period: emptyToUndefined(formData.get("period")),
    technicalFeature: emptyToUndefined(formData.get("technicalFeature")),
    inspectionDate: emptyToUndefined(formData.get("inspectionDate")),
    nextInspectionDate: emptyToUndefined(formData.get("nextInspectionDate")),
    location: emptyToUndefined(formData.get("location")),
    responsiblePerson: emptyToUndefined(formData.get("responsiblePerson")),
  });

  return {
    ...parsed,
    inspectionDate: parsed.inspectionDate ? new Date(parsed.inspectionDate) : undefined,
    nextInspectionDate: parsed.nextInspectionDate
      ? new Date(parsed.nextInspectionDate)
      : undefined,
  };
}

async function requireWriteAccess() {
  const session = await auth();
  if (!session?.user || !canWrite(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
}

export async function createInspection(formData: FormData) {
  await requireWriteAccess();
  const data = parseForm(formData);

  await prisma.periodicInspection.create({ data });

  revalidatePath("/inspections");
  revalidatePath("/");
  redirect("/inspections");
}

export async function updateInspection(id: string, formData: FormData) {
  await requireWriteAccess();
  const data = parseForm(formData);

  await prisma.periodicInspection.update({ where: { id }, data });

  revalidatePath("/inspections");
  revalidatePath("/");
  redirect("/inspections");
}

export async function deleteInspection(id: string) {
  const session = await auth();
  if (!session?.user || !canDelete(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }

  await prisma.periodicInspection.delete({ where: { id } });
  revalidatePath("/inspections");
  revalidatePath("/");
}

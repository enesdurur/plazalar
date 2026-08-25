"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";

const schema = z.object({
  code: z.string().optional(),
  deviceName: z.string().min(1, "Cihaz adı zorunludur"),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNo: z.string().optional(),
  calibrationCompany: z.string().optional(),
  certificateNo: z.string().optional(),
  measurementRange: z.string().optional(),
  precision: z.string().optional(),
  lastCalibrationDate: z.string().optional(),
  nextCalibrationDate: z.string().optional(),
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
    deviceName: formData.get("deviceName"),
    brand: emptyToUndefined(formData.get("brand")),
    model: emptyToUndefined(formData.get("model")),
    serialNo: emptyToUndefined(formData.get("serialNo")),
    calibrationCompany: emptyToUndefined(formData.get("calibrationCompany")),
    certificateNo: emptyToUndefined(formData.get("certificateNo")),
    measurementRange: emptyToUndefined(formData.get("measurementRange")),
    precision: emptyToUndefined(formData.get("precision")),
    lastCalibrationDate: emptyToUndefined(formData.get("lastCalibrationDate")),
    nextCalibrationDate: emptyToUndefined(formData.get("nextCalibrationDate")),
    location: emptyToUndefined(formData.get("location")),
    responsiblePerson: emptyToUndefined(formData.get("responsiblePerson")),
  });

  return {
    ...parsed,
    lastCalibrationDate: parsed.lastCalibrationDate
      ? new Date(parsed.lastCalibrationDate)
      : undefined,
    nextCalibrationDate: parsed.nextCalibrationDate
      ? new Date(parsed.nextCalibrationDate)
      : undefined,
  };
}

async function requireWriteAccess() {
  const session = await auth();
  if (!session?.user || !canWrite(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
}

export async function createCalibration(formData: FormData) {
  await requireWriteAccess();
  const data = parseForm(formData);

  await prisma.calibration.create({ data });

  revalidatePath("/calibrations");
  revalidatePath("/");
  redirect("/calibrations");
}

export async function updateCalibration(id: string, formData: FormData) {
  await requireWriteAccess();
  const data = parseForm(formData);

  await prisma.calibration.update({ where: { id }, data });

  revalidatePath("/calibrations");
  revalidatePath("/");
  redirect("/calibrations");
}

export async function deleteCalibration(id: string) {
  const session = await auth();
  if (!session?.user || !canDelete(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }

  await prisma.calibration.delete({ where: { id } });
  revalidatePath("/calibrations");
  revalidatePath("/");
}

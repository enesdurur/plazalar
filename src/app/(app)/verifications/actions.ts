"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";

const schema = z.object({
  deviceName: z.string().min(1, "Cihaz adı zorunludur"),
  deviceSerialNo: z.string().optional(),
  usageLocation: z.string().optional(),
  receivedBy: z.string().optional(),
  verificationPeriod: z.string().optional(),
  referenceCertificateNo: z.string().optional(),
  measurementRange: z.string().optional(),
  result: z.string().optional(),
  verificationDate: z.string().optional(),
  nextVerificationDate: z.string().optional(),
});

function emptyToUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

function parseForm(formData: FormData) {
  const parsed = schema.parse({
    deviceName: formData.get("deviceName"),
    deviceSerialNo: emptyToUndefined(formData.get("deviceSerialNo")),
    usageLocation: emptyToUndefined(formData.get("usageLocation")),
    receivedBy: emptyToUndefined(formData.get("receivedBy")),
    verificationPeriod: emptyToUndefined(formData.get("verificationPeriod")),
    referenceCertificateNo: emptyToUndefined(formData.get("referenceCertificateNo")),
    measurementRange: emptyToUndefined(formData.get("measurementRange")),
    result: emptyToUndefined(formData.get("result")),
    verificationDate: emptyToUndefined(formData.get("verificationDate")),
    nextVerificationDate: emptyToUndefined(formData.get("nextVerificationDate")),
  });

  return {
    ...parsed,
    verificationDate: parsed.verificationDate ? new Date(parsed.verificationDate) : undefined,
    nextVerificationDate: parsed.nextVerificationDate
      ? new Date(parsed.nextVerificationDate)
      : undefined,
  };
}

async function requireWriteAccess() {
  const session = await auth();
  if (!session?.user || !canWrite(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
}

export async function createVerification(formData: FormData) {
  await requireWriteAccess();
  const data = parseForm(formData);

  await prisma.verification.create({ data });

  revalidatePath("/verifications");
  revalidatePath("/");
  redirect("/verifications");
}

export async function updateVerification(id: string, formData: FormData) {
  await requireWriteAccess();
  const data = parseForm(formData);

  await prisma.verification.update({ where: { id }, data });

  revalidatePath("/verifications");
  revalidatePath("/");
  redirect("/verifications");
}

export async function deleteVerification(id: string) {
  const session = await auth();
  if (!session?.user || !canDelete(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }

  await prisma.verification.delete({ where: { id } });
  revalidatePath("/verifications");
  revalidatePath("/");
}

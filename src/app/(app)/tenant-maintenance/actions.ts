"use server";

import { z } from "zod";
import { parseOrThrow, zOptionalDateString } from "@/lib/form-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canWrite, canDelete } from "@/lib/permissions";
import { getSelectedPlaza } from "@/lib/plaza";

const schema = z.object({
  tenantId: z.string().min(1, "Kiracı seçimi zorunludur"),
  maintenanceType: z.string().min(1, "Bakım türü zorunludur"),
  period: z.string().optional(),
  lastMaintenanceDate: zOptionalDateString(),
  nextMaintenanceDate: zOptionalDateString(),
  responsiblePerson: z.string().optional(),
  note: z.string().optional(),
});

function emptyToUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

function parseForm(formData: FormData) {
  const parsed = parseOrThrow(schema, {
    tenantId: formData.get("tenantId"),
    maintenanceType: formData.get("maintenanceType"),
    period: emptyToUndefined(formData.get("period")),
    lastMaintenanceDate: emptyToUndefined(formData.get("lastMaintenanceDate")),
    nextMaintenanceDate: emptyToUndefined(formData.get("nextMaintenanceDate")),
    responsiblePerson: emptyToUndefined(formData.get("responsiblePerson")),
    note: emptyToUndefined(formData.get("note")),
  });

  return {
    ...parsed,
    lastMaintenanceDate: parsed.lastMaintenanceDate
      ? new Date(parsed.lastMaintenanceDate)
      : undefined,
    nextMaintenanceDate: parsed.nextMaintenanceDate
      ? new Date(parsed.nextMaintenanceDate)
      : undefined,
  };
}

async function requireWriteAccess() {
  const session = await auth();
  if (!session?.user || !canWrite(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
}

async function requireTenantInPlaza(tenantId: string) {
  const plaza = await getSelectedPlaza();
  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId, plazaId: plaza.id } });
  if (!tenant) {
    throw new Error("Kiracı bulunamadı.");
  }
}

export async function createTenantMaintenance(formData: FormData) {
  await requireWriteAccess();
  const data = parseForm(formData);
  await requireTenantInPlaza(data.tenantId);

  await prisma.tenantMaintenance.create({ data });

  revalidatePath("/tenant-maintenance");
  revalidatePath("/");
  redirect("/tenant-maintenance");
}

export async function updateTenantMaintenance(id: string, formData: FormData) {
  await requireWriteAccess();
  const data = parseForm(formData);
  await requireTenantInPlaza(data.tenantId);

  const plaza = await getSelectedPlaza();
  await prisma.tenantMaintenance.updateMany({
    where: { id, tenant: { plazaId: plaza.id } },
    data,
  });

  revalidatePath("/tenant-maintenance");
  revalidatePath("/");
  redirect("/tenant-maintenance");
}

export async function deleteTenantMaintenance(id: string) {
  const session = await auth();
  if (!session?.user || !canDelete(session.user.role)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  const plaza = await getSelectedPlaza();

  await prisma.tenantMaintenance.deleteMany({ where: { id, tenant: { plazaId: plaza.id } } });
  revalidatePath("/tenant-maintenance");
  revalidatePath("/");
}

export async function toggleTenantMaintenanceWeekEntry(itemId: string, year: number, week: number) {
  await requireWriteAccess();
  const plaza = await getSelectedPlaza();
  const item = await prisma.tenantMaintenanceItem.findFirst({
    where: { id: itemId, tenant: { plazaId: plaza.id } },
  });
  if (!item) throw new Error("Bakım kalemi bu plazaya ait değil.");
  if (!item.scheduledWeeks.includes(week)) {
    throw new Error("Bu hafta bu kalem için planlanmamış.");
  }

  const existing = await prisma.tenantMaintenanceWeekEntry.findUnique({
    where: { itemId_year_week: { itemId, year, week } },
  });

  // Cycle: boş (null) -> yapıldı (true) -> yapılmadı (false) -> boş (null)
  const next = existing?.completed === true ? false : existing?.completed === false ? null : true;

  await prisma.tenantMaintenanceWeekEntry.upsert({
    where: { itemId_year_week: { itemId, year, week } },
    update: { completed: next },
    create: { itemId, year, week, completed: next },
  });

  revalidatePath("/tenant-maintenance");
  revalidatePath("/");
}

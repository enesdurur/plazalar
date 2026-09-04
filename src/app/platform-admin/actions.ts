"use server";

import { z } from "zod";
import { parseOrThrow } from "@/lib/form-error";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canManagePlatform } from "@/lib/permissions";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user || !canManagePlatform(session.user)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  return session;
}

const createOrganizationSchema = z.object({
  orgName: z.string().min(1, "Organizasyon adı zorunludur"),
  orgSlug: z
    .string()
    .regex(/^[a-z0-9-]*$/, "Sadece küçük harf, rakam ve tire kullanılabilir")
    .optional()
    .or(z.literal("")),
  adminName: z.string().min(1, "Yönetici adı zorunludur"),
  adminEmail: z.string().email("Geçerli bir e-posta girin"),
  adminPassword: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  plazaName: z.string().optional().or(z.literal("")),
});

export async function createOrganization(formData: FormData) {
  await requireSuperAdmin();

  const data = parseOrThrow(createOrganizationSchema, {
    orgName: formData.get("orgName"),
    orgSlug: formData.get("orgSlug") || "",
    adminName: formData.get("adminName"),
    adminEmail: formData.get("adminEmail"),
    adminPassword: formData.get("adminPassword"),
    plazaName: formData.get("plazaName") || "",
  });

  const existingUser = await prisma.user.findUnique({ where: { email: data.adminEmail } });
  if (existingUser) throw new Error("Bu e-posta adresi zaten kullanılıyor.");

  if (data.orgSlug) {
    const existingSlug = await prisma.organization.findUnique({ where: { slug: data.orgSlug } });
    if (existingSlug) throw new Error("Bu slug zaten kullanılıyor.");
  }

  const passwordHash = await bcrypt.hash(data.adminPassword, 10);

  await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: data.orgName,
        slug: data.orgSlug || null,
      },
    });

    await tx.user.create({
      data: {
        name: data.adminName,
        email: data.adminEmail,
        passwordHash,
        role: "ADMIN",
        organizationId: organization.id,
        // Yeni organizasyonun kendi Kullanıcılar sekmesini yönetebilsin diye — bu,
        // isSuperAdmin (platform genelinde organizasyon açma) ile karıştırılmamalı.
        isPlatformAdmin: true,
      },
    });

    if (data.plazaName) {
      await tx.plaza.create({
        data: {
          name: data.plazaName,
          organizationId: organization.id,
        },
      });
    }
  });

  revalidatePath("/platform-admin");
  redirect("/platform-admin");
}

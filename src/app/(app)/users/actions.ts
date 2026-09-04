"use server";

import { z } from "zod";
import { parseOrThrow } from "@/lib/form-error";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canManageUsers } from "@/lib/permissions";

const roleSchema = z.enum([
  "ADMIN",
  "TECHNICIAN",
  "STPU",
  "TEKNIKER",
  "MANAGEMENT_DIRECTOR",
  "VIEWER",
]);

const createSchema = z.object({
  name: z.string().min(1, "Ad Soyad zorunludur"),
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  role: roleSchema,
});

const updateSchema = z.object({
  name: z.string().min(1, "Ad Soyad zorunludur"),
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.union([z.string().min(6, "Şifre en az 6 karakter olmalıdır"), z.literal("")]),
  role: roleSchema,
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  return session;
}

export async function createUser(formData: FormData) {
  const session = await requireAdmin();

  const data = parseOrThrow(createSchema, {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("Bu e-posta adresi zaten kullanılıyor.");

  const passwordHash = await bcrypt.hash(data.password, 10);
  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      organizationId: session.user.organizationId,
    },
  });

  revalidatePath("/users");
  redirect("/users");
}

export async function updateUser(id: string, formData: FormData) {
  const session = await requireAdmin();

  const data = parseOrThrow(updateSchema, {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password") || "",
    role: formData.get("role"),
  });

  if (id === session.user.id && data.role !== "ADMIN") {
    throw new Error("Kendi yöneticilik rolünüzü kaldıramazsınız.");
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing && existing.id !== id) throw new Error("Bu e-posta adresi zaten kullanılıyor.");

  const { count } = await prisma.user.updateMany({
    where: { id, organizationId: session.user.organizationId },
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      ...(data.password ? { passwordHash: await bcrypt.hash(data.password, 10) } : {}),
    },
  });
  if (count === 0) throw new Error("Kullanıcı bulunamadı.");

  revalidatePath("/users");
  redirect("/users");
}

export async function deleteUser(id: string) {
  const session = await requireAdmin();

  if (id === session.user.id) {
    throw new Error("Kendi hesabınızı silemezsiniz.");
  }

  const target = await prisma.user.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!target) throw new Error("Kullanıcı bulunamadı.");

  if (target.role === "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN", organizationId: session.user.organizationId },
    });
    if (adminCount <= 1) throw new Error("Son yönetici hesabı silinemez.");
  }

  await prisma.user.deleteMany({
    where: { id, organizationId: session.user.organizationId },
  });
  revalidatePath("/users");
}

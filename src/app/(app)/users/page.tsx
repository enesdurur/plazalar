import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canManageUsers } from "@/lib/permissions";
import { UsersTable } from "./users-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanıcılar",
};

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user.role)) {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Kullanıcılar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Toplam {users.length} kullanıcı. Demo hesapların şifrelerini değiştirebilir veya
            gerçek kullanıcılar ekleyebilirsiniz.
          </p>
        </div>
        <Link
          href="/users/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Yeni Kullanıcı
        </Link>
      </div>

      <div className="mt-6">
        <UsersTable users={users} currentUserId={session.user.id} />
      </div>
    </div>
  );
}

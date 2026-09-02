import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canManageUsers } from "@/lib/permissions";
import { UserForm } from "../user-form";
import { createUser } from "../actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yeni Kullanıcı",
};

export default async function NewUserPage() {
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user)) {
    redirect("/");
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Yeni Kullanıcı Ekle</h1>
      <div className="mt-6">
        <UserForm action={createUser} />
      </div>
    </div>
  );
}

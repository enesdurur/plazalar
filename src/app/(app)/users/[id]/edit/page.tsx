import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canManageUsers } from "@/lib/permissions";
import { UserForm } from "../../user-form";
import { updateUser } from "../../actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanıcı Düzenle",
};

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user)) {
    redirect("/");
  }

  const { id } = await params;
  const user = await prisma.user.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });

  if (!user) notFound();

  const updateWithId = updateUser.bind(null, id);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Kullanıcı Düzenle</h1>
      <div className="mt-6">
        <UserForm action={updateWithId} user={user} />
      </div>
    </div>
  );
}

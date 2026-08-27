"use client";

import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { ROLE_LABELS } from "@/lib/permissions";
import { deleteUser } from "./actions";
import type { User } from "@prisma/client";

export function UsersTable({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  const columns: DataTableColumn<User>[] = [
    {
      key: "name",
      header: "Ad Soyad",
      filterValue: (u) => u.name,
      render: (u) => (
        <span className="font-medium text-slate-900">
          {u.name}
          {u.id === currentUserId && (
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              Siz
            </span>
          )}
        </span>
      ),
    },
    {
      key: "email",
      header: "E-posta",
      filterValue: (u) => u.email,
      render: (u) => <span className="text-slate-600">{u.email}</span>,
    },
    {
      key: "role",
      header: "Rol",
      filterValue: (u) => ROLE_LABELS[u.role],
      render: (u) => <span className="text-slate-600">{ROLE_LABELS[u.role]}</span>,
    },
    {
      key: "createdAt",
      header: "Oluşturulma",
      filterValue: (u) => u.createdAt.toLocaleDateString("tr-TR"),
      render: (u) => (
        <span className="whitespace-nowrap text-slate-600">
          {u.createdAt.toLocaleDateString("tr-TR")}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={users}
      rowKey={(u) => u.id}
      emptyMessage="Henüz kullanıcı yok."
      maxHeight="70vh"
      renderActions={(u) => (
        <>
          <Link
            href={`/users/${u.id}/edit`}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Düzenle
          </Link>
          {u.id !== currentUserId && (
            <DeleteButton
              action={deleteUser.bind(null, u.id)}
              confirmMessage={`${u.name} kullanıcısını silmek istediğinize emin misiniz?`}
            />
          )}
        </>
      )}
    />
  );
}

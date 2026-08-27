import type { Role } from "@prisma/client";

// VIEWER can only read. TECHNICIAN and ADMIN can create/edit records & machines.
// Only ADMIN can delete or manage users.
export function canWrite(role: Role | undefined) {
  return role === "ADMIN" || role === "TECHNICIAN";
}

export function canDelete(role: Role | undefined) {
  return role === "ADMIN";
}

export function canManageUsers(role: Role | undefined) {
  return role === "ADMIN";
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Yönetici",
  TECHNICIAN: "Teknisyen",
  VIEWER: "İzleyici",
};

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "ADMIN", label: "Yönetici" },
  { value: "TECHNICIAN", label: "Teknisyen" },
  { value: "VIEWER", label: "İzleyici" },
];

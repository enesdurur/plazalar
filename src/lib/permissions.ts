import type { Role } from "@prisma/client";

// VIEWER can only read. TECHNICIAN, STPU, MANAGEMENT_DIRECTOR and ADMIN can create/edit
// records & machines. Only ADMIN or MANAGEMENT_DIRECTOR can approve maliyet girişleri so they
// flow into Gerçekleşen Bütçe. Only ADMIN can delete or manage users.
export function canWrite(role: Role | undefined) {
  return (
    role === "ADMIN" ||
    role === "TECHNICIAN" ||
    role === "STPU" ||
    role === "MANAGEMENT_DIRECTOR"
  );
}

export function canApprove(role: Role | undefined) {
  return role === "ADMIN" || role === "MANAGEMENT_DIRECTOR";
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
  STPU: "STPU",
  MANAGEMENT_DIRECTOR: "Yönetim Müdürü",
  VIEWER: "İzleyici",
};

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "ADMIN", label: "Yönetici" },
  { value: "TECHNICIAN", label: "Teknisyen" },
  { value: "STPU", label: "STPU" },
  { value: "MANAGEMENT_DIRECTOR", label: "Yönetim Müdürü" },
  { value: "VIEWER", label: "İzleyici" },
];

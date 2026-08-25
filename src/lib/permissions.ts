import type { Role } from "@prisma/client";

// VIEWER can only read. TECHNICIAN and ADMIN can create/edit records & machines.
// Only ADMIN can delete or manage users.
export function canWrite(role: Role | undefined) {
  return role === "ADMIN" || role === "TECHNICIAN";
}

export function canDelete(role: Role | undefined) {
  return role === "ADMIN";
}

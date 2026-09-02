import type { Role } from "@prisma/client";

// VIEWER can only read. TECHNICIAN, STPU, MANAGEMENT_DIRECTOR and ADMIN can create/edit
// records & machines. Only ADMIN or MANAGEMENT_DIRECTOR can approve maliyet girişleri so they
// flow into Gerçekleşen Bütçe. TECHNICIAN uploads the bakım formu, STPU uploads the fatura;
// TEKNIKER can upload both (and is expected to catch/follow up on missing ones). Only ADMIN
// can delete.
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

export function canAddMaintenanceForm(role: Role | undefined) {
  return role === "ADMIN" || role === "TECHNICIAN" || role === "TEKNIKER";
}

export function canAddInvoice(role: Role | undefined) {
  return role === "ADMIN" || role === "STPU" || role === "TEKNIKER";
}

export function canAddAttachmentKind(role: Role | undefined, kind: "INVOICE" | "MAINTENANCE_FORM") {
  return kind === "INVOICE" ? canAddInvoice(role) : canAddMaintenanceForm(role);
}

export function canDelete(role: Role | undefined) {
  return role === "ADMIN";
}

// "Yönetici" (ADMIN) rolü, o organizasyonun birden çok kişisine atanabilir (ör. bir müdür
// yardımcısı) — bunların hepsi Kullanıcılar sekmesini görüp yönetebilirse yönetim kimin
// hesap açıp kapatabileceğini kontrol edemez. Bu yüzden Kullanıcılar sekmesi role="ADMIN"
// yerine ayrı bir isPlatformAdmin bayrağına bağlı: bunu sadece organizasyonun gerçek
// sahibi/baş yöneticisi taşır, veritabanında elle işaretlenir.
export function canManageUsers(user: { isPlatformAdmin?: boolean } | undefined) {
  return !!user?.isPlatformAdmin;
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Yönetici",
  TECHNICIAN: "Teknisyen",
  STPU: "STPU",
  TEKNIKER: "Tekniker",
  MANAGEMENT_DIRECTOR: "Yönetim Müdürü",
  VIEWER: "İzleyici",
};

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "ADMIN", label: "Yönetici" },
  { value: "TECHNICIAN", label: "Teknisyen" },
  { value: "STPU", label: "STPU" },
  { value: "TEKNIKER", label: "Tekniker" },
  { value: "MANAGEMENT_DIRECTOR", label: "Yönetim Müdürü" },
  { value: "VIEWER", label: "İzleyici" },
];

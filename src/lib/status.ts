export type ValidityStatus = "GECERLI" | "SURESI_GECTI" | "TARIH_YOK";

export function validityStatus(nextDate: Date | null | undefined): ValidityStatus {
  if (!nextDate) return "TARIH_YOK";
  return nextDate.getTime() >= Date.now() ? "GECERLI" : "SURESI_GECTI";
}

export const VALIDITY_LABELS: Record<ValidityStatus, string> = {
  GECERLI: "Geçerli",
  SURESI_GECTI: "Süresi Geçti",
  TARIH_YOK: "Tarih Girilmedi",
};

export const VALIDITY_CLASSES: Record<ValidityStatus, string> = {
  GECERLI: "bg-green-100 text-green-700",
  SURESI_GECTI: "bg-red-100 text-red-700",
  TARIH_YOK: "bg-slate-100 text-slate-500",
};

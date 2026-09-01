/**
 * Maliyet girişlerinde Yönetim Müdürü onayı: onaylayabilen roller için tıklanabilir bir
 * onay/onay kaldır düğmesi, diğer roller için salt-okunur "Onaylandı / Onay Bekliyor" rozeti.
 */
export function ApprovalControl({
  action,
  approved,
  canApprove,
}: {
  action?: (formData: FormData) => Promise<void>;
  approved: boolean;
  canApprove: boolean;
}) {
  const label = approved ? "Onaylandı" : "Onay Bekliyor";
  const classes = approved
    ? "bg-green-100 text-green-700"
    : "bg-amber-100 text-amber-700";

  if (!canApprove || !action) {
    return (
      <span
        className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}
      >
        {label}
      </span>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="approved" value={(!approved).toString()} />
      <button
        type="submit"
        title={approved ? "Onayı kaldır" : "Gerçekleşen Bütçe'ye yansıtmak için onayla"}
        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium transition-colors hover:opacity-80 ${classes}`}
      >
        <span aria-hidden>{approved ? "☑" : "☐"}</span>
        {label}
      </button>
    </form>
  );
}

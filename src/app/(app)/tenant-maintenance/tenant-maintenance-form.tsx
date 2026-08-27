import type { Tenant, TenantMaintenance } from "@prisma/client";
import { SubmitButton } from "@/components/submit-button";

function toDateInput(date: Date | null | undefined) {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function TenantMaintenanceForm({
  action,
  tenants,
  item,
}: {
  action: (formData: FormData) => Promise<void>;
  tenants: Tenant[];
  item?: TenantMaintenance;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Kiracı *">
          <select name="tenantId" required defaultValue={item?.tenantId ?? ""} className="input">
            <option value="">Seçiniz</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.floor} - {t.companyName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Bakım Türü *">
          <input
            name="maintenanceType"
            required
            placeholder="ör. Fan Coil Bakımı"
            defaultValue={item?.maintenanceType}
            className="input"
          />
        </Field>
        <Field label="Periyot">
          <input
            name="period"
            placeholder="ör. Yıllık"
            defaultValue={item?.period ?? ""}
            className="input"
          />
        </Field>
        <Field label="Sorumlu Kişi">
          <input
            name="responsiblePerson"
            defaultValue={item?.responsiblePerson ?? ""}
            className="input"
          />
        </Field>
        <Field label="Son Bakım Tarihi">
          <input
            name="lastMaintenanceDate"
            type="date"
            defaultValue={toDateInput(item?.lastMaintenanceDate)}
            className="input"
          />
        </Field>
        <Field label="Sonraki Bakım Tarihi">
          <input
            name="nextMaintenanceDate"
            type="date"
            defaultValue={toDateInput(item?.nextMaintenanceDate)}
            className="input"
          />
        </Field>
      </div>

      <Field label="Not">
        <textarea name="note" rows={3} defaultValue={item?.note ?? ""} className="input" />
      </Field>

      <div className="flex gap-3 pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

import type { Tenant } from "@prisma/client";
import { SubmitButton } from "@/components/submit-button";

export function TenantForm({
  action,
  tenant,
  nextSortOrder,
}: {
  action: (formData: FormData) => Promise<void>;
  tenant?: Tenant;
  nextSortOrder?: number;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Kat *">
          <input name="floor" required defaultValue={tenant?.floor} className="input" />
        </Field>
        <Field label="Kiracı *">
          <input
            name="companyName"
            required
            defaultValue={tenant?.companyName}
            className="input"
          />
        </Field>
        <Field label="Sıra No">
          <input
            name="sortOrder"
            type="number"
            defaultValue={tenant?.sortOrder ?? nextSortOrder ?? 0}
            className="input"
          />
        </Field>
        <Field label="Gerçek Alan (m²)">
          <input
            name="areaSqm"
            type="number"
            step="0.01"
            min="0"
            defaultValue={tenant?.areaSqm ? Number(tenant.areaSqm) : undefined}
            className="input"
          />
        </Field>
      </div>

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

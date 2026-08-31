import type { Machine, IssueType, Technician, MaintenanceRecord } from "@prisma/client";
import { SubmitButton } from "@/components/submit-button";
import { SparePartField } from "./spare-part-field";
import { SparePartCostField } from "./spare-part-cost-field";

function toDatetimeLocal(date: Date | null | undefined) {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function RecordForm({
  action,
  machines,
  issueTypes,
  technicians,
  spareParts,
  record,
}: {
  action: (formData: FormData) => Promise<void>;
  machines: Machine[];
  issueTypes: IssueType[];
  technicians: Technician[];
  spareParts: { id: string; name: string }[];
  record?: MaintenanceRecord;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Makine *">
          <select name="machineId" required defaultValue={record?.machineId ?? ""} className="input">
            <option value="">Seçiniz</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="İşlem Türü">
          <input type="hidden" name="operationType" value={record?.operationType ?? "ARIZA"} />
          <div className="input flex items-center bg-slate-50 text-slate-500">
            {record?.operationType === "BAKIM" ? "Bakım (eski kayıt)" : "Arıza"}
          </div>
        </Field>
        <Field label="Arıza / Bakım Türü">
          <select name="issueTypeId" defaultValue={record?.issueTypeId ?? ""} className="input">
            <option value="">Seçiniz</option>
            {issueTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Arızayı / Bakımı Yapan">
          <select name="technicianId" defaultValue={record?.technicianId ?? ""} className="input">
            <option value="">Seçiniz</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Açıklama *">
        <textarea
          name="description"
          required
          rows={3}
          defaultValue={record?.description}
          className="input"
        />
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Bildirim Zamanı *">
          <input
            name="reportedAt"
            type="datetime-local"
            required
            defaultValue={toDatetimeLocal(record?.reportedAt)}
            className="input"
          />
        </Field>
        <Field label="Müdahale Zamanı">
          <input
            name="respondedAt"
            type="datetime-local"
            defaultValue={toDatetimeLocal(record?.respondedAt)}
            className="input"
          />
        </Field>
        <Field label="Bitiş Zamanı">
          <input
            name="finishedAt"
            type="datetime-local"
            defaultValue={toDatetimeLocal(record?.finishedAt)}
            className="input"
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SparePartField
          spareParts={spareParts}
          defaultSparePartId={record?.sparePartId}
          defaultSparePartOther={record?.sparePartOther}
        />
        <Field label="Adet">
          <input
            name="sparePartQty"
            type="number"
            min={0}
            defaultValue={record?.sparePartQty ?? ""}
            className="input"
          />
        </Field>
        <SparePartCostField
          defaultCost={record?.sparePartCost?.toString() ?? null}
          defaultCurrency={record?.sparePartCostCurrency ?? "TRY"}
          defaultExchangeRate={record?.sparePartExchangeRate?.toString() ?? null}
        />
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

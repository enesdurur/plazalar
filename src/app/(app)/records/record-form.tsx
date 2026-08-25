import type {
  Machine,
  IssueType,
  Technician,
  SparePart,
  MaintenanceRecord,
} from "@prisma/client";

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
  spareParts: SparePart[];
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
        <Field label="İşlem Türü *">
          <select
            name="operationType"
            required
            defaultValue={record?.operationType ?? "ARIZA"}
            className="input"
          >
            <option value="ARIZA">Arıza</option>
            <option value="BAKIM">Bakım</option>
          </select>
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
        <Field label="Kullanılan Yedek Parça">
          <select name="sparePartId" defaultValue={record?.sparePartId ?? ""} className="input">
            <option value="">Seçiniz</option>
            {spareParts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Adet">
          <input
            name="sparePartQty"
            type="number"
            min={0}
            defaultValue={record?.sparePartQty ?? ""}
            className="input"
          />
        </Field>
        <Field label="Yedek Parça Maliyeti (₺)">
          <input
            name="sparePartCost"
            type="number"
            step="0.01"
            defaultValue={record?.sparePartCost?.toString() ?? ""}
            className="input"
          />
        </Field>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Kaydet
        </button>
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

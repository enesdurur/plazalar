import type { Machine, IssueType, Technician, MaintenanceRecord } from "@prisma/client";
import { SubmitButton } from "@/components/submit-button";
import { SparePartField } from "./spare-part-field";
import { SparePartCostField } from "./spare-part-cost-field";
import { IssueTypeField } from "./issue-type-field";

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function RecordForm({
  action,
  machines,
  issueTypes,
  technicians,
  spareParts,
  record,
  canSetCompany,
}: {
  action: (formData: FormData) => Promise<void>;
  machines: Machine[];
  issueTypes: IssueType[];
  technicians: Technician[];
  spareParts: { id: string; name: string }[];
  record?: MaintenanceRecord;
  canSetCompany: boolean;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Makine">
          <select name="machineId" defaultValue={record?.machineId ?? ""} className="input">
            <option value="">Genel İş (makine/teçhizatla ilgisi yok)</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <input type="hidden" name="operationType" value={record?.operationType ?? "ARIZA"} />
        <Field label="Şirket *">
          {canSetCompany ? (
            <select
              name="responsibleCompany"
              defaultValue={record?.responsibleCompany ?? "BURGAZ"}
              className="input"
            >
              <option value="BURGAZ">Burgaz</option>
              <option value="KAPITAL">Kapital</option>
            </select>
          ) : (
            <>
              <input type="hidden" name="responsibleCompany" value="BURGAZ" />
              <div className="input flex items-center bg-slate-50 text-slate-500">Burgaz</div>
            </>
          )}
        </Field>
        <IssueTypeField
          issueTypes={issueTypes}
          defaultIssueTypeId={record?.issueTypeId}
          defaultIssueTypeOther={record?.issueTypeOther}
        />
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
        <Field label="Bildirim Tarihi *">
          <input
            name="reportedAt"
            type="date"
            required
            defaultValue={toDateInputValue(record?.reportedAt)}
            className="input"
          />
        </Field>
        <Field label="Müdahale Tarihi">
          <input
            name="respondedAt"
            type="date"
            defaultValue={toDateInputValue(record?.respondedAt)}
            className="input"
          />
        </Field>
        <Field label="Bitiş Tarihi">
          <input
            name="finishedAt"
            type="date"
            defaultValue={toDateInputValue(record?.finishedAt)}
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

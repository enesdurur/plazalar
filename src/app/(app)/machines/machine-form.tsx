import type { Line, Machine } from "@prisma/client";
import { SubmitButton } from "@/components/submit-button";

export function MachineForm({
  action,
  lines,
  machine,
}: {
  action: (formData: FormData) => Promise<void>;
  lines: Line[];
  machine?: Machine;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Makine Adı *">
          <input
            name="name"
            required
            defaultValue={machine?.name}
            className="input"
          />
        </Field>
        <Field label="Makine Kodu">
          <input name="code" defaultValue={machine?.code ?? ""} className="input" />
        </Field>
        <Field label="Hat">
          <select name="lineId" defaultValue={machine?.lineId ?? ""} className="input">
            <option value="">Seçiniz</option>
            {lines.map((line) => (
              <option key={line.id} value={line.id}>
                {line.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Adet">
          <input
            name="quantity"
            type="number"
            min={1}
            defaultValue={machine?.quantity ?? 1}
            className="input"
          />
        </Field>
        <Field label="Marka">
          <input name="brand" defaultValue={machine?.brand ?? ""} className="input" />
        </Field>
        <Field label="Model">
          <input name="model" defaultValue={machine?.model ?? ""} className="input" />
        </Field>
        <Field label="Seri No">
          <input name="serialNo" defaultValue={machine?.serialNo ?? ""} className="input" />
        </Field>
        <Field label="Gücü (KW)">
          <input
            name="powerKw"
            type="number"
            step="0.1"
            defaultValue={machine?.powerKw ?? ""}
            className="input"
          />
        </Field>
        <Field label="Bulunduğu Yer / Bölüm">
          <input name="location" defaultValue={machine?.location ?? ""} className="input" />
        </Field>
        <Field label="Özellik">
          <input name="feature" defaultValue={machine?.feature ?? ""} className="input" />
        </Field>
        <Field label="Dağıtım Panosu">
          <input
            name="distributionPanel"
            defaultValue={machine?.distributionPanel ?? ""}
            className="input"
          />
        </Field>
        <Field label="MCC Otomasyon Panosu">
          <input name="mccPanel" defaultValue={machine?.mccPanel ?? ""} className="input" />
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

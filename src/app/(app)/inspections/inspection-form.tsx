import type { PeriodicInspection } from "@prisma/client";

function toDateInput(date: Date | null | undefined) {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function InspectionForm({
  action,
  item,
}: {
  action: (formData: FormData) => Promise<void>;
  item?: PeriodicInspection;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Makina/Ekipman Kodu">
          <input name="code" defaultValue={item?.code ?? ""} className="input" />
        </Field>
        <Field label="Makina/Ekipman Adı *">
          <input name="name" required defaultValue={item?.name} className="input" />
        </Field>
        <Field label="Marka">
          <input name="brand" defaultValue={item?.brand ?? ""} className="input" />
        </Field>
        <Field label="Rapor No">
          <input
            name="reportNo"
            type="number"
            defaultValue={item?.reportNo ?? ""}
            className="input"
          />
        </Field>
        <Field label="Periyot">
          <input
            name="period"
            placeholder="ör. 1 yıllık"
            defaultValue={item?.period ?? ""}
            className="input"
          />
        </Field>
        <Field label="Teknik Özellik">
          <input
            name="technicalFeature"
            defaultValue={item?.technicalFeature ?? ""}
            className="input"
          />
        </Field>
        <Field label="Son Muayene Tarihi">
          <input
            name="inspectionDate"
            type="date"
            defaultValue={toDateInput(item?.inspectionDate)}
            className="input"
          />
        </Field>
        <Field label="Bir Sonraki Muayene Tarihi">
          <input
            name="nextInspectionDate"
            type="date"
            defaultValue={toDateInput(item?.nextInspectionDate)}
            className="input"
          />
        </Field>
        <Field label="Bulunduğu Yer / Bölüm">
          <input name="location" defaultValue={item?.location ?? ""} className="input" />
        </Field>
        <Field label="Sorumlu Kişi">
          <input
            name="responsiblePerson"
            defaultValue={item?.responsiblePerson ?? ""}
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

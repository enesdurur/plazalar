import type { Calibration } from "@prisma/client";
import { SubmitButton } from "@/components/submit-button";

function toDateInput(date: Date | null | undefined) {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function CalibrationForm({
  action,
  item,
}: {
  action: (formData: FormData) => Promise<void>;
  item?: Calibration;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Ölçüm Aleti Kodu">
          <input name="code" defaultValue={item?.code ?? ""} className="input" />
        </Field>
        <Field label="Cihaz Adı *">
          <input name="deviceName" required defaultValue={item?.deviceName} className="input" />
        </Field>
        <Field label="Marka">
          <input name="brand" defaultValue={item?.brand ?? ""} className="input" />
        </Field>
        <Field label="Model">
          <input name="model" defaultValue={item?.model ?? ""} className="input" />
        </Field>
        <Field label="Seri No">
          <input name="serialNo" defaultValue={item?.serialNo ?? ""} className="input" />
        </Field>
        <Field label="Kalibrasyon Firması">
          <input
            name="calibrationCompany"
            defaultValue={item?.calibrationCompany ?? ""}
            className="input"
          />
        </Field>
        <Field label="Sertifika No">
          <input
            name="certificateNo"
            defaultValue={item?.certificateNo ?? ""}
            className="input"
          />
        </Field>
        <Field label="Ölçüm Aralığı">
          <input
            name="measurementRange"
            defaultValue={item?.measurementRange ?? ""}
            className="input"
          />
        </Field>
        <Field label="Hassasiyet">
          <input name="precision" defaultValue={item?.precision ?? ""} className="input" />
        </Field>
        <Field label="Bulunduğu Yer / Bölüm">
          <input name="location" defaultValue={item?.location ?? ""} className="input" />
        </Field>
        <Field label="Son Kalibrasyon Tarihi">
          <input
            name="lastCalibrationDate"
            type="date"
            defaultValue={toDateInput(item?.lastCalibrationDate)}
            className="input"
          />
        </Field>
        <Field label="Bir Sonraki Kalibrasyon Tarihi">
          <input
            name="nextCalibrationDate"
            type="date"
            defaultValue={toDateInput(item?.nextCalibrationDate)}
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

import type { Verification } from "@prisma/client";

function toDateInput(date: Date | null | undefined) {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function VerificationForm({
  action,
  item,
}: {
  action: (formData: FormData) => Promise<void>;
  item?: Verification;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Cihaz Adı *">
          <input name="deviceName" required defaultValue={item?.deviceName} className="input" />
        </Field>
        <Field label="Seri No">
          <input
            name="deviceSerialNo"
            defaultValue={item?.deviceSerialNo ?? ""}
            className="input"
          />
        </Field>
        <Field label="Kullanım Yeri">
          <input
            name="usageLocation"
            defaultValue={item?.usageLocation ?? ""}
            className="input"
          />
        </Field>
        <Field label="Teslim Alan">
          <input name="receivedBy" defaultValue={item?.receivedBy ?? ""} className="input" />
        </Field>
        <Field label="Doğrulama Periyodu">
          <input
            name="verificationPeriod"
            placeholder="ör. 6 ay"
            defaultValue={item?.verificationPeriod ?? ""}
            className="input"
          />
        </Field>
        <Field label="Referans Sertifika No">
          <input
            name="referenceCertificateNo"
            defaultValue={item?.referenceCertificateNo ?? ""}
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
        <Field label="Sonuç">
          <input name="result" defaultValue={item?.result ?? ""} className="input" />
        </Field>
        <Field label="Doğrulama Tarihi">
          <input
            name="verificationDate"
            type="date"
            defaultValue={toDateInput(item?.verificationDate)}
            className="input"
          />
        </Field>
        <Field label="Gelecek Doğrulama Tarihi">
          <input
            name="nextVerificationDate"
            type="date"
            defaultValue={toDateInput(item?.nextVerificationDate)}
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

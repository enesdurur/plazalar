import { SubmitButton } from "@/components/submit-button";

const MONTH_NAMES = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export function OtherExpenseForm({
  action,
  lineItems,
  defaults,
}: {
  action: (formData: FormData) => Promise<void>;
  lineItems: { id: string; label: string }[];
  defaults?: {
    lineItemId: string;
    month: number;
    amount: number;
    note: string | null;
  };
}) {
  return (
    <form action={action} className="max-w-lg space-y-4">
      <Field label="Kalem *">
        <select name="lineItemId" required defaultValue={defaults?.lineItemId ?? ""} className="input">
          <option value="">Seçiniz</option>
          {lineItems.map((i) => (
            <option key={i.id} value={i.id}>
              {i.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Ay *">
        <select name="month" required defaultValue={defaults?.month ?? ""} className="input">
          <option value="">Seçiniz</option>
          {MONTH_NAMES.map((name, i) => (
            <option key={name} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Tutar (TL) *">
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={defaults?.amount}
          className="input"
        />
      </Field>

      <Field label="Not (opsiyonel)">
        <textarea name="note" rows={3} defaultValue={defaults?.note ?? ""} className="input" />
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

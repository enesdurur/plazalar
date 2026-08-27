import type { User } from "@prisma/client";
import { ROLE_OPTIONS } from "@/lib/permissions";
import { SubmitButton } from "@/components/submit-button";

export function UserForm({
  action,
  user,
}: {
  action: (formData: FormData) => Promise<void>;
  user?: User;
}) {
  return (
    <form action={action} className="max-w-lg space-y-4">
      <Field label="Ad Soyad *">
        <input name="name" required defaultValue={user?.name} className="input" />
      </Field>
      <Field label="E-posta *">
        <input
          name="email"
          type="email"
          required
          defaultValue={user?.email}
          className="input"
        />
      </Field>
      <Field label={user ? "Yeni Şifre" : "Şifre *"}>
        <input
          name="password"
          type="password"
          required={!user}
          minLength={6}
          placeholder={user ? "Değiştirmek istemiyorsanız boş bırakın" : undefined}
          className="input"
        />
      </Field>
      <Field label="Rol *">
        <select name="role" defaultValue={user?.role ?? "VIEWER"} required className="input">
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
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

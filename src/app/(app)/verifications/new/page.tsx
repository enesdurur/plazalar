import { VerificationForm } from "../verification-form";
import { createVerification } from "../actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yeni Doğrulama Kaydı",
};

export default function NewVerificationPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Yeni Doğrulama Kaydı</h1>
      <div className="mt-6">
        <VerificationForm action={createVerification} />
      </div>
    </div>
  );
}

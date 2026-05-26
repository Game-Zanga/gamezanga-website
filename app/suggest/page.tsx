"use client";

import { useLocale } from "@/components/LocaleProvider";
import { PhaseGate } from "@/components/ui/PhaseGate";
import { SignInGate } from "@/components/auth/SignInGate";
import { SuggestForm } from "@/components/forms/SuggestForm";

export default function SuggestPage() {
  const { tr } = useLocale();
  return (
    <section className="max-w-2xl mx-auto px-4 py-12 md:py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-3">{tr("suggest_heading")}</h1>
      <p className="text-center text-[color:var(--color-muted)] mb-8">{tr("suggest_intro_ar")}</p>
      <PhaseGate
        allow={["suggestion"]}
        fallback={
          <div className="card-glow p-8 text-center text-[color:var(--color-muted)]">
            {tr("suggest_closed")}
          </div>
        }
      >
        <SignInGate redirectTo="/suggest">{(email) => <SuggestForm email={email} />}</SignInGate>
      </PhaseGate>
    </section>
  );
}

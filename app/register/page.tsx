"use client";

import { RegisterForm } from "@/components/forms/RegisterForm";
import { PhaseGate } from "@/components/ui/PhaseGate";
import { useLocale } from "@/components/LocaleProvider";

export default function RegisterPage() {
  const { tr } = useLocale();
  return (
    <section className="max-w-2xl mx-auto px-4 py-12 md:py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-3">{tr("register_heading")}</h1>
      <p className="text-center text-[color:var(--color-muted)] mb-10">{tr("register_intro")}</p>
      <PhaseGate
        allow={["registration", "suggestion", "voting"]}
        fallback={
          <div className="card-glow p-8 text-center text-[color:var(--color-muted)]">
            {tr("register_closed")}
          </div>
        }
      >
        <RegisterForm />
      </PhaseGate>
    </section>
  );
}

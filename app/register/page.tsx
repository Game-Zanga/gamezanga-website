"use client";

import { useEffect, useState } from "react";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { useLocale } from "@/components/LocaleProvider";
import { isRegistrationOpen } from "@/lib/phase-utils";

/**
 * Gates the form on isRegistrationOpen() — the exact predicate /api/register
 * enforces — rather than on a list of phases.
 *
 * This used to be a PhaseGate allowing ["registration","suggestion","voting"],
 * which silently closed the form the moment the jam started: registration_close
 * is the END of the jam, but once jam_start passes the phase becomes
 * "jam_active", so the page showed "التسجيل مغلق" for the whole weekend while the
 * API happily kept accepting signups. Deriving the gate from the same function
 * the API uses means the two can't drift apart again.
 */
function RegistrationGate({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const update = () => setOpen(isRegistrationOpen());
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  if (open === null) return null; // avoid an SSR/CSR mismatch on the gate
  return <>{open ? children : fallback}</>;
}

export default function RegisterPage() {
  const { tr } = useLocale();
  return (
    <section className="max-w-2xl mx-auto px-4 py-12 md:py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-3">{tr("register_heading")}</h1>
      <p className="text-center text-[color:var(--color-muted)] mb-6">{tr("register_intro")}</p>
      <div
        className="rounded-xl border p-4 md:p-5 mb-8 text-sm leading-relaxed"
        style={{
          borderColor: "color-mix(in oklab, var(--color-accent) 45%, transparent)",
          background: "color-mix(in oklab, var(--color-accent) 8%, transparent)",
        }}
      >
        {tr("register_team_note")}
      </div>
      <RegistrationGate
        fallback={
          <div className="card-glow p-8 text-center text-[color:var(--color-muted)]">
            {tr("register_closed")}
          </div>
        }
      >
        <RegisterForm />
      </RegistrationGate>
    </section>
  );
}

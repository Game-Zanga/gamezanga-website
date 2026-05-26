"use client";

import { useLocale } from "@/components/LocaleProvider";
import { PhaseGate } from "@/components/ui/PhaseGate";
import { SignInGate } from "@/components/auth/SignInGate";
import { VoteForm } from "@/components/forms/VoteForm";
import { WinningTheme } from "@/components/WinningTheme";

export default function VotePage() {
  const { tr } = useLocale();
  return (
    <section className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-3">{tr("vote_heading")}</h1>
      <p className="text-center text-[color:var(--color-muted)] mb-8">{tr("vote_intro")}</p>

      <WinningTheme />

      <PhaseGate
        allow={["voting"]}
        fallback={
          <div className="card-glow p-8 text-center text-[color:var(--color-muted)]">
            {tr("vote_closed")}
          </div>
        }
      >
        <SignInGate redirectTo="/vote">{() => <VoteForm />}</SignInGate>
      </PhaseGate>
    </section>
  );
}

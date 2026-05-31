"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { PhaseGate } from "@/components/ui/PhaseGate";
import { SignInGate } from "@/components/auth/SignInGate";
import { VoteForm } from "@/components/forms/VoteForm";
import { WinningTheme } from "@/components/WinningTheme";
import { JAM_CONFIG } from "@/lib/jam-config";

function VotingUnavailableCard() {
  const { tr } = useLocale();
  const [notStarted, setNotStarted] = useState<boolean | null>(null);

  useEffect(() => {
    setNotStarted(Date.now() < new Date(JAM_CONFIG.voting_open).getTime());
  }, []);

  if (notStarted === null) return null;
  return (
    <div className="card-glow p-8 text-center text-[color:var(--color-muted)]">
      {tr(notStarted ? "vote_not_started" : "vote_closed")}
    </div>
  );
}

export default function VotePage() {
  const { tr } = useLocale();
  return (
    <section className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-3">{tr("vote_heading")}</h1>
      <p className="text-center text-[color:var(--color-muted)] mb-8">{tr("vote_intro")}</p>

      <WinningTheme />

      <PhaseGate allow={["voting"]} fallback={<VotingUnavailableCard />}>
        <SignInGate redirectTo="/vote">{() => <VoteForm />}</SignInGate>
      </PhaseGate>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getCurrentPhase, type Phase } from "@/lib/phase-utils";

type Props = {
  allow: Phase[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

// Renders children only when the current phase is in the allow list.
// Falls back to `fallback` (typically a "closed" message) otherwise.
export function PhaseGate({ allow, children, fallback = null }: Props) {
  const [phase, setPhase] = useState<Phase | null>(null);

  useEffect(() => {
    const update = () => setPhase(getCurrentPhase());
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (phase === null) return null; // avoid SSR/CSR mismatch on the gate
  return allow.includes(phase) ? <>{children}</> : <>{fallback}</>;
}

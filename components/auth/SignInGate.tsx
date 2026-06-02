"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { getBrowserClient } from "@/lib/supabase-browser";
import { trCode } from "@/lib/i18n";

type Status =
  | { kind: "loading" }
  | { kind: "signed_in"; email: string }
  | { kind: "signed_out" };

export function SignInGate({
  children,
  redirectTo,
}: {
  children: (email: string) => React.ReactNode;
  redirectTo?: string;
}) {
  const { tr, locale } = useLocale();
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const supabase = getBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setStatus({ kind: "signed_in", email: data.user.email });
      else setStatus({ kind: "signed_out" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session?.user?.email) setStatus({ kind: "signed_in", email: session.user.email });
      else setStatus({ kind: "signed_out" });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function sendMagic(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const supabase = getBrowserClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const target = redirectTo || (typeof window !== "undefined" ? window.location.pathname : "/");
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          // Only registered participants (auth users pre-created in /api/register) can request a link.
          shouldCreateUser: false,
          emailRedirectTo: `${origin}/auth/verify?next=${encodeURIComponent(target)}`,
        },
      });
      if (error) {
        // Supabase returns "Signups not allowed for otp" when the email has no auth user.
        // That means the participant hasn't registered yet.
        const msg = error.message || "";
        const status = (error as { status?: number }).status;
        if (/signups? not allowed|not\s*allowed for otp|user not found/i.test(msg)) {
          setError(trCode("err_not_registered_signin", locale));
        } else if (status === 429 || /rate.?limit|too many/i.test(msg)) {
          setError(trCode("err_rate_limited", locale));
        } else {
          setError(trCode("err_send_link_failed", locale));
        }
        return;
      }
      setLinkSent(true);
    } catch {
      setError(trCode("err_network", locale));
    } finally {
      setSending(false);
    }
  }

  async function signOut() {
    const supabase = getBrowserClient();
    await supabase.auth.signOut();
  }

  if (status.kind === "loading") {
    return <div className="text-[color:var(--color-muted)] text-center py-10">{tr("auth_verifying")}</div>;
  }

  if (status.kind === "signed_in") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/60">
          <div className="text-sm">
            <span className="text-[color:var(--color-muted)]">{tr("auth_signed_in_as")}</span>{" "}
            <span className="font-medium">{status.email}</span>
          </div>
          <button onClick={signOut} className="btn btn-ghost text-sm">
            {tr("auth_sign_out")}
          </button>
        </div>
        {children(status.email)}
      </div>
    );
  }

  return (
    <div className="card-glow p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-2">{tr("auth_heading")}</h2>
      <p className="text-sm text-[color:var(--color-muted)] mb-4">{tr("auth_intro")}</p>
      {linkSent ? (
        <div className="text-[color:var(--color-success)]">{tr("auth_link_sent")}</div>
      ) : (
        <form onSubmit={sendMagic} className="space-y-3">
          <input
            type="email"
            required
            className="input"
            placeholder={locale === "ar" ? "you@example.com" : "you@example.com"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={sending} className="btn btn-primary w-full">
            {sending ? tr("submitting") : tr("auth_send_link")}
          </button>
        </form>
      )}
    </div>
  );
}

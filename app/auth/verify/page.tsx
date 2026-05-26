"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { getBrowserClient } from "@/lib/supabase-browser";

function VerifyInner() {
  const { tr, locale } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const next = params.get("next") || "/";
    const supabase = getBrowserClient();

    // Supabase v2 magic-link returns to the app with a #access_token=...&type=magiclink hash;
    // detectSessionInUrl (default true) will pick it up automatically. We just wait for the session.
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session) router.replace(next);
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (data.session) {
        router.replace(next);
        return;
      }
      if (error) setError(error.message);
    });

    return () => sub.subscription.unsubscribe();
  }, [params, router]);

  return (
    <section className="max-w-md mx-auto px-4 py-24 text-center">
      <div className="text-xl font-bold mb-2">{tr("auth_verifying")}</div>
      {error && (
        <div className="error mt-4">
          {locale === "ar" ? "فشل التحقق: " : "Verification failed: "}
          {error}
        </div>
      )}
    </section>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="text-center py-24 text-[color:var(--color-muted)]">…</div>}>
      <VerifyInner />
    </Suspense>
  );
}

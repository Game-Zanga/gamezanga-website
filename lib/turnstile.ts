// Server-side Cloudflare Turnstile verification.
//
// Called from POST handlers (currently /api/register) after parsing the request
// body. Returns { ok: true } if the token verifies or if Turnstile isn't
// configured (TURNSTILE_SECRET_KEY missing → dev / preview without keys, fail
// open so the form still works locally).

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileResult = { ok: true } | { ok: false; reason: string };

export async function verifyTurnstile(token: string, req: Request): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true }; // not configured — allow in dev

  if (!token || typeof token !== "string") {
    return { ok: false, reason: "missing-token" };
  }

  // Forward the client IP if we can find it — improves Cloudflare's risk scoring.
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    undefined;

  const params = new URLSearchParams({ secret, response: token });
  if (ip) params.set("remoteip", ip);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = (await res.json()) as { success: boolean; "error-codes"?: string[] };
    if (data.success) return { ok: true };
    return { ok: false, reason: (data["error-codes"] ?? []).join(",") || "unknown" };
  } catch (e) {
    console.error("Turnstile verify network error:", e);
    return { ok: false, reason: "network-error" };
  }
}

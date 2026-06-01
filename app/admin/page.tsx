"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

const STORAGE_KEY = "gz_admin_secret";

export default function AdminPage() {
  const { tr, locale } = useLocale();
  const [secret, setSecret] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSecret(sessionStorage.getItem(STORAGE_KEY));
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  if (!secret) {
    return (
      <section className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold mb-6">{tr("admin_heading")}</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sessionStorage.setItem(STORAGE_KEY, input);
            setSecret(input);
          }}
          className="card-glow p-6 space-y-3"
        >
          <label className="label">{tr("admin_login_prompt")}</label>
          <input
            type="password"
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            required
            dir="ltr"
          />
          <button className="btn btn-primary w-full" type="submit">
            {tr("admin_login")}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">{tr("admin_heading")}</h1>
        <button
          onClick={() => {
            sessionStorage.removeItem(STORAGE_KEY);
            setSecret(null);
          }}
          className="btn btn-ghost"
        >
          {tr("admin_logout")}
        </button>
      </div>

      <RegistrationsPanel secret={secret} locale={locale} />
      <SuggestionsPanel secret={secret} locale={locale} />
      <LiveResultsPanel secret={secret} locale={locale} />
      <SetThemePanel secret={secret} />
      <BroadcastPanel secret={secret} />
    </section>
  );
}

function adminFetch(url: string, secret: string, init?: RequestInit) {
  return fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "x-admin-secret": secret,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });
}

type Participant = {
  id: string;
  full_name: string;
  email: string;
  mobile: string | null;
  gender: string | null;
  age_group: string;
  country: string;
  country_other: string | null;
  skills: string[];
  skills_other: string | null;
  participated_before: boolean;
  editions: string[];
  created_at: string;
};

function RegistrationsPanel({ secret, locale }: { secret: string; locale: "ar" | "en" }) {
  const { tr } = useLocale();
  const [rows, setRows] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // "current" | "all" | "13" | "12" | ... — controls which editions are queried.
  const [filter, setFilter] = useState<string>("current");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = filter === "current" ? "" : `?edition=${filter}`;
      const res = await adminFetch(`/api/admin/registrations${params}`, secret);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setRows(data.participants);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  function exportCsv() {
    const headers = [
      "created_at",
      "full_name",
      "email",
      "mobile",
      "gender",
      "age_group",
      "country",
      "country_other",
      "skills",
      "skills_other",
      "participated_before",
      "editions",
    ];
    const escape = (v: unknown) => {
      const s = v == null ? "" : Array.isArray(v) ? v.join("|") : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lines = [headers.join(",")].concat(
      rows.map((r) => headers.map((h) => escape((r as unknown as Record<string, unknown>)[h])).join(","))
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gamezanga-registrations-${filter}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-xl font-bold">
          {tr("admin_registrations")} <span className="text-[color:var(--color-muted)] font-normal">({rows.length})</span>
        </h2>
        <div className="flex items-center gap-2">
          <select
            className="select text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            dir="ltr"
          >
            <option value="current">Current edition</option>
            <option value="all">All editions</option>
            <option value="13">Edition 13</option>
            <option value="SE">Special Edition</option>
            <option value="12">Edition 12</option>
            <option value="11">Edition 11</option>
            <option value="10">Edition 10</option>
          </select>
          <button onClick={exportCsv} className="btn btn-ghost text-sm">
            {tr("admin_export_csv")}
          </button>
        </div>
      </div>
      {loading ? (
        <div className="text-[color:var(--color-muted)]">…</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="overflow-x-auto card-glow">
          <table className="w-full text-sm">
            <thead className="text-start text-[color:var(--color-muted)]">
              <tr>
                <Th>{locale === "ar" ? "الاسم" : "Name"}</Th>
                <Th>Email</Th>
                <Th>{locale === "ar" ? "النسخ" : "Editions"}</Th>
                <Th>{locale === "ar" ? "البلد" : "Country"}</Th>
                <Th>{locale === "ar" ? "العمر" : "Age"}</Th>
                <Th>{locale === "ar" ? "المهارات" : "Skills"}</Th>
                <Th>{locale === "ar" ? "سبق؟" : "Before?"}</Th>
                <Th>{locale === "ar" ? "التاريخ" : "Date"}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-[color:var(--color-border)]">
                  <Td>{r.full_name}</Td>
                  <Td>
                    <span dir="ltr">{r.email}</span>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {(r.editions ?? []).map((ed) => (
                        <span
                          key={ed}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono tabular-nums border border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)]"
                          dir="ltr"
                        >
                          {ed}
                        </span>
                      ))}
                    </div>
                  </Td>
                  <Td>{r.country === "Other" ? r.country_other : r.country}</Td>
                  <Td>{r.age_group}</Td>
                  <Td>{r.skills?.join(", ")}</Td>
                  <Td>{r.participated_before ? "✓" : "—"}</Td>
                  <Td>{new Date(r.created_at).toLocaleDateString()}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type Suggestion = {
  id: string;
  theme_ar: string;
  theme_en: string | null;
  approved: boolean | null;
  created_at: string;
};

function SuggestionsPanel({ secret, locale }: { secret: string; locale: "ar" | "en" }) {
  const { tr } = useLocale();
  const [rows, setRows] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await adminFetch("/api/admin/suggestions", secret);
    const data = await res.json();
    if (res.ok) setRows(data.suggestions);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setApproval(id: string, approved: boolean | null) {
    await adminFetch("/api/admin/suggestions", secret, {
      method: "POST",
      body: JSON.stringify({ id, approved }),
    });
    load();
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">
        {tr("admin_suggestions")} <span className="text-[color:var(--color-muted)] font-normal">({rows.length})</span>
      </h2>
      {loading ? (
        <div className="text-[color:var(--color-muted)]">…</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {rows.map((s) => (
            <div key={s.id} className="card-glow p-4 flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{s.theme_ar}</div>
                {s.theme_en && <div className="text-sm text-[color:var(--color-muted)]" dir="ltr">{s.theme_en}</div>}
                <div className="text-xs text-[color:var(--color-muted)] mt-1">
                  {s.approved === true
                    ? locale === "ar"
                      ? "معتمد"
                      : "approved"
                    : s.approved === false
                    ? locale === "ar"
                      ? "مرفوض"
                      : "rejected"
                    : locale === "ar"
                    ? "قيد المراجعة"
                    : "pending"}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => setApproval(s.id, true)} className="btn btn-ghost text-xs">
                  {tr("admin_approve")}
                </button>
                <button onClick={() => setApproval(s.id, false)} className="btn btn-ghost text-xs">
                  {tr("admin_reject")}
                </button>
                <button onClick={() => setApproval(s.id, null)} className="btn btn-ghost text-xs">
                  ↺
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type Result = {
  id: string;
  theme_ar: string;
  theme_en: string | null;
  score: number;
  yes: number;
  neutral: number;
  no: number;
  voters: number;
};

function LiveResultsPanel({ secret, locale }: { secret: string; locale: "ar" | "en" }) {
  const { tr } = useLocale();
  const [rows, setRows] = useState<Result[]>([]);
  const [distinctVoters, setDistinctVoters] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settingWinner, setSettingWinner] = useState<string | null>(null);

  async function load() {
    setError("");
    try {
      const res = await adminFetch("/api/admin/results", secret);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setRows(data.results);
      setDistinctVoters(data.distinct_voters ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setWinner(r: Result) {
    const label = locale === "ar" ? r.theme_ar : r.theme_en || r.theme_ar;
    if (!confirm(`${tr("admin_set_as_winner")}: ${label}?`)) return;
    setSettingWinner(r.id);
    try {
      const res = await adminFetch("/api/admin/set-theme", secret, {
        method: "POST",
        body: JSON.stringify({ theme_ar: r.theme_ar, theme_en: r.theme_en ?? "" }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.message || "Failed");
    } finally {
      setSettingWinner(null);
    }
  }

  const topScore = rows.length > 0 ? rows[0].score : 0;

  return (
    <div>
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">
            {tr("admin_live_results")}{" "}
            <span className="text-[color:var(--color-muted)] font-normal">
              ({rows.length})
            </span>
          </h2>
          <p className="text-xs text-[color:var(--color-muted)] mt-1">
            {tr("admin_live_results_note")}
          </p>
          {rows.length > 0 && (
            <p className="text-xs text-[color:var(--color-muted)] mt-1">
              {tr("admin_total_voters")}:{" "}
              <strong className="text-[color:var(--color-fg)]">
                <span dir="ltr">{distinctVoters}</span>
              </strong>
            </p>
          )}
        </div>
        <button onClick={load} className="btn btn-ghost text-sm" disabled={loading}>
          {loading ? "…" : tr("admin_refresh")}
        </button>
      </div>

      {loading && rows.length === 0 ? (
        <div className="text-[color:var(--color-muted)]">…</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : rows.length === 0 ? (
        <div className="card-glow p-6 text-center text-[color:var(--color-muted)]">
          {tr("admin_no_votes_yet")}
        </div>
      ) : (
        <div className="overflow-x-auto card-glow">
          <table className="w-full text-sm">
            <thead className="text-[color:var(--color-muted)] border-b border-[color:var(--color-border)]">
              <tr>
                <Th>#</Th>
                <Th>{locale === "ar" ? "الثيم" : "Theme"}</Th>
                <Th>{tr("vote_score")}</Th>
                <Th>
                  <span className="text-[color:var(--color-success)]">{tr("vote_positive")}</span>
                </Th>
                <Th>{tr("vote_neutral")}</Th>
                <Th>
                  <span className="text-[color:var(--color-danger)]">{tr("vote_negative")}</span>
                </Th>
                <Th>{tr("vote_voters")}</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isLeader = r.score === topScore && topScore !== 0;
                const scoreColor =
                  r.score > 0
                    ? "text-[color:var(--color-success)]"
                    : r.score < 0
                    ? "text-[color:var(--color-danger)]"
                    : "text-[color:var(--color-muted)]";
                return (
                  <tr
                    key={r.id}
                    className={`border-t border-[color:var(--color-border)] ${
                      isLeader ? "bg-[color:var(--color-accent)]/5" : ""
                    }`}
                  >
                    <Td>
                      <span className="font-mono text-xs text-[color:var(--color-muted)]" dir="ltr">
                        {i + 1}
                      </span>
                    </Td>
                    <Td>
                      <div className="font-medium">{r.theme_ar}</div>
                      {r.theme_en && (
                        <div className="text-xs text-[color:var(--color-muted)]" dir="ltr">
                          {r.theme_en}
                        </div>
                      )}
                    </Td>
                    <Td>
                      <span className={`font-mono font-bold tabular-nums ${scoreColor}`} dir="ltr">
                        {r.score > 0 ? `+${r.score}` : r.score}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-mono tabular-nums text-[color:var(--color-success)]" dir="ltr">
                        {r.yes}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-mono tabular-nums text-[color:var(--color-muted)]" dir="ltr">
                        {r.neutral}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-mono tabular-nums text-[color:var(--color-danger)]" dir="ltr">
                        {r.no}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-mono tabular-nums" dir="ltr">
                        {r.voters}
                      </span>
                    </Td>
                    <Td>
                      <button
                        onClick={() => setWinner(r)}
                        disabled={settingWinner === r.id}
                        className="btn btn-ghost text-xs whitespace-nowrap"
                      >
                        {settingWinner === r.id ? "…" : tr("admin_set_as_winner")}
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SetThemePanel({ secret }: { secret: string }) {
  const { tr } = useLocale();
  const [ar, setAr] = useState("");
  const [en, setEn] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const res = await adminFetch("/api/admin/set-theme", secret, {
      method: "POST",
      body: JSON.stringify({ theme_ar: ar, theme_en: en }),
    });
    const data = await res.json();
    setMsg(res.ok ? "✓" : data.message || "Failed");
    setBusy(false);
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{tr("admin_set_winner")}</h2>
      <form onSubmit={submit} className="card-glow p-6 space-y-3 max-w-xl">
        <input className="input" placeholder="Theme (Arabic)" value={ar} onChange={(e) => setAr(e.target.value)} />
        <input className="input" placeholder="Theme (English)" value={en} onChange={(e) => setEn(e.target.value)} dir="ltr" />
        <button disabled={busy} className="btn btn-primary">
          {busy ? "…" : tr("admin_send")}
        </button>
        {msg && <div className="text-sm text-[color:var(--color-muted)]">{msg}</div>}
      </form>
    </div>
  );
}

function BroadcastPanel({ secret }: { secret: string }) {
  const { tr } = useLocale();
  const [subject, setSubject] = useState("");
  const [bodyAr, setBodyAr] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  // "current" | "all" | csv list of edition tags, e.g. "13,14" or "SE,13"
  const [target, setTarget] = useState<string>("current");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const targetLabel =
      target === "current"
        ? "Current edition (14)"
        : target === "all"
        ? "ALL participants ever registered"
        : `Editions: ${target}`;
    if (!confirm(`Send to: ${targetLabel}?`)) return;

    setBusy(true);
    setMsg("");

    // Translate UI target → API body (tags are strings since editions is TEXT[])
    let editionsPayload: string[] | "all" | undefined;
    if (target === "all") editionsPayload = "all";
    else if (target === "current") editionsPayload = undefined; // API defaults to current
    else editionsPayload = target.split(",").map((s) => s.trim()).filter(Boolean);

    const res = await adminFetch("/api/admin/broadcast", secret, {
      method: "POST",
      body: JSON.stringify({
        subject,
        body_ar: bodyAr,
        body_en: bodyEn,
        ...(editionsPayload !== undefined ? { editions: editionsPayload } : {}),
      }),
    });
    const data = await res.json();
    setMsg(res.ok ? `✓ sent ${data.sent}/${data.total} (failed: ${data.failed})` : data.message || "Failed");
    setBusy(false);
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{tr("admin_broadcast")}</h2>
      <form onSubmit={submit} className="card-glow p-6 space-y-3 max-w-xl">
        <label className="block">
          <div className="text-sm text-[color:var(--color-muted)] mb-1">Target audience</div>
          <select
            className="select text-sm w-full"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            dir="ltr"
          >
            <option value="current">Current edition only</option>
            <option value="all">All participants ever (any edition)</option>
            <option value="13">Edition 13 only</option>
            <option value="SE">Special Edition only</option>
            <option value="12">Edition 12 only</option>
            <option value="13,SE,12">Editions 13 + SE + 12 (all past)</option>
            <option value="13,14">Editions 13 + 14</option>
          </select>
        </label>
        <input className="input" placeholder={tr("admin_subject")} value={subject} onChange={(e) => setSubject(e.target.value)} required />
        <textarea
          className="textarea h-32"
          placeholder={`${tr("admin_message")} (Arabic)`}
          value={bodyAr}
          onChange={(e) => setBodyAr(e.target.value)}
          required
        />
        <textarea
          className="textarea h-32"
          placeholder={`${tr("admin_message")} (English)`}
          value={bodyEn}
          onChange={(e) => setBodyEn(e.target.value)}
          dir="ltr"
        />
        <button disabled={busy} className="btn btn-primary">
          {busy ? "…" : tr("admin_send")}
        </button>
        {msg && <div className="text-sm text-[color:var(--color-muted)]">{msg}</div>}
      </form>
    </div>
  );
}

const Th = ({ children }: { children?: React.ReactNode }) => (
  <th className="text-start font-medium px-3 py-2 whitespace-nowrap">{children}</th>
);
const Td = ({ children }: { children?: React.ReactNode }) => (
  <td className="px-3 py-2 align-top">{children}</td>
);

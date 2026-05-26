"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { trCode } from "@/lib/i18n";

type Theme = {
  id: string;
  theme_ar: string;
  theme_en: string | null;
  score: number;
  positive: number;
  neutral: number;
  negative: number;
  voters: number;
};

type Value = -1 | 0 | 1;

export function VoteForm() {
  const { locale, tr } = useLocale();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, Value>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Record<string, true>>({});

  async function refresh() {
    const [t, v] = await Promise.all([
      fetch("/api/themes").then((r) => r.json()),
      fetch("/api/vote").then((r) => r.json()),
    ]);
    setThemes(t.themes ?? []);
    setMyVotes((v.votes ?? {}) as Record<string, Value>);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function rate(theme_id: string, value: Value) {
    setPending((p) => ({ ...p, [theme_id]: true }));
    setError("");
    const prev = myVotes[theme_id];
    setMyVotes((m) => ({ ...m, [theme_id]: value }));
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme_id, value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMyVotes((m) => {
          const next = { ...m };
          if (prev === undefined) delete next[theme_id];
          else next[theme_id] = prev;
          return next;
        });
        setError(trCode(data?.code, locale));
      } else {
        const t = await fetch("/api/themes").then((r) => r.json());
        setThemes(t.themes ?? []);
      }
    } catch {
      setError(trCode("err_network", locale));
    } finally {
      setPending((p) => {
        const { [theme_id]: _ignored, ...rest } = p;
        return rest;
      });
    }
  }

  if (loading) {
    return (
      <div className="text-center py-10 text-[color:var(--color-muted)]">
        <div className="inline-block w-6 h-6 rounded-full border-2 border-[color:var(--color-border)] border-t-[color:var(--color-accent)] animate-spin" />
      </div>
    );
  }

  if (themes.length === 0) {
    return (
      <div className="card-glow p-8 text-center text-[color:var(--color-muted)]">
        {locale === "ar" ? "لا توجد ثيمات معتمدة بعد." : "No approved themes yet."}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <InstructionsCard />

      {error && <div className="error">{error}</div>}

      <div className="space-y-2">
        {themes.map((th, i) => (
          <ThemeRow
            key={th.id}
            theme={th}
            index={i + 1}
            locale={locale}
            tr={tr}
            myRating={myVotes[th.id]}
            isPending={!!pending[th.id]}
            onRate={(v) => rate(th.id, v)}
          />
        ))}
      </div>
    </div>
  );
}

function InstructionsCard() {
  const { tr } = useLocale();
  return (
    <div className="card-glow p-5">
      <p className="text-[color:var(--color-fg)] mb-4 leading-relaxed">{tr("vote_intro")}</p>

      <div className="grid sm:grid-cols-3 gap-3">
        <HelpItem
          variant="positive"
          icon={<CheckIcon size={20} />}
          label={tr("vote_positive")}
          help={tr("vote_yes_help")}
        />
        <HelpItem
          variant="neutral"
          icon={<DashIcon size={20} />}
          label={tr("vote_neutral")}
          help={tr("vote_neutral_help")}
        />
        <HelpItem
          variant="negative"
          icon={<XIcon size={20} />}
          label={tr("vote_negative")}
          help={tr("vote_no_help")}
        />
      </div>
    </div>
  );
}

function HelpItem({
  variant,
  icon,
  label,
  help,
}: {
  variant: "positive" | "neutral" | "negative";
  icon: React.ReactNode;
  label: string;
  help: string;
}) {
  const accent =
    variant === "positive"
      ? "var(--color-success)"
      : variant === "negative"
      ? "var(--color-danger)"
      : "var(--color-accent)";
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[color:var(--color-surface)]/40 border border-[color:var(--color-border)]">
      <div
        className="shrink-0 w-9 h-9 rounded-md grid place-items-center"
        style={{
          background: `color-mix(in oklab, ${accent} 18%, transparent)`,
          color: accent,
        }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-bold text-sm" style={{ color: accent }}>
          {label}
        </div>
        <div className="text-xs text-[color:var(--color-muted)] leading-snug mt-0.5">{help}</div>
      </div>
    </div>
  );
}

function ThemeRow({
  theme,
  index,
  locale,
  tr,
  myRating,
  isPending,
  onRate,
}: {
  theme: Theme;
  index: number;
  locale: "ar" | "en";
  tr: (k: Parameters<ReturnType<typeof useLocale>["tr"]>[0]) => string;
  myRating: Value | undefined;
  isPending: boolean;
  onRate: (v: Value) => void;
}) {
  const primary = locale === "ar" ? theme.theme_ar : theme.theme_en || theme.theme_ar;
  const secondary = locale === "ar" ? theme.theme_en : theme.theme_ar;
  const showSecondary = secondary && secondary !== primary;

  return (
    <div className="card-glow p-4 md:p-4">
      <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
        {/* Theme info: number + title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="shrink-0 w-8 h-8 rounded-md grid place-items-center font-mono text-xs font-bold text-[color:var(--color-muted)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/50"
            aria-hidden
          >
            <span dir="ltr">{index}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-lg leading-tight truncate">{primary}</div>
            {showSecondary && (
              <div
                className="text-xs text-[color:var(--color-muted)] leading-tight mt-0.5 truncate"
                dir={locale === "ar" ? "ltr" : "rtl"}
              >
                {secondary}
              </div>
            )}
          </div>
        </div>

        {/* Buttons — inline on md+, stacked across full width on mobile */}
        <div className="grid grid-cols-3 gap-2 w-full md:w-auto md:flex md:flex-row md:gap-2 shrink-0">
          <RateButton
            variant="positive"
            active={myRating === 1}
            disabled={isPending}
            label={tr("vote_positive")}
            icon={<CheckIcon size={18} />}
            onClick={() => onRate(1)}
          />
          <RateButton
            variant="neutral"
            active={myRating === 0}
            disabled={isPending}
            label={tr("vote_neutral")}
            icon={<DashIcon size={18} />}
            onClick={() => onRate(0)}
          />
          <RateButton
            variant="negative"
            active={myRating === -1}
            disabled={isPending}
            label={tr("vote_negative")}
            icon={<XIcon size={18} />}
            onClick={() => onRate(-1)}
          />
        </div>
      </div>
    </div>
  );
}

function RateButton({
  variant,
  active,
  disabled,
  label,
  icon,
  onClick,
}: {
  variant: "positive" | "neutral" | "negative";
  active: boolean;
  disabled: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  const accent =
    variant === "positive"
      ? "var(--color-success)"
      : variant === "negative"
      ? "var(--color-danger)"
      : "var(--color-accent)";

  const activeStyles: React.CSSProperties = active
    ? {
        background: `color-mix(in oklab, ${accent} 16%, transparent)`,
        borderColor: accent,
        boxShadow: `0 0 0 1px ${accent}, 0 6px 20px color-mix(in oklab, ${accent} 30%, transparent)`,
      }
    : {};

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      style={activeStyles}
      className={`flex items-center justify-center gap-2 h-11 px-3 w-full md:w-auto md:min-w-[96px]
        rounded-lg border border-[color:var(--color-border)]
        bg-[color:var(--color-surface)]/40 hover:bg-[color:var(--color-surface)]
        transition-all disabled:opacity-50 disabled:cursor-not-allowed
        ${active ? "" : "hover:translate-y-[-1px]"}`}
    >
      <span
        className="inline-flex items-center justify-center"
        style={{ color: active ? accent : "var(--color-muted)" }}
      >
        {icon}
      </span>
      <span
        className="text-sm font-semibold"
        style={{ color: active ? accent : "var(--color-fg)" }}
      >
        {label}
      </span>
    </button>
  );
}

// Icons take an explicit `size` so they render correctly regardless of how
// their wrapper is laid out (flex item, grid item, inline span, etc).
type IconProps = { size?: number };

const CheckIcon = ({ size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);

const XIcon = ({ size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M6 6l12 12M6 18L18 6" />
  </svg>
);

const DashIcon = ({ size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    aria-hidden
  >
    <path d="M5 12h14" />
  </svg>
);

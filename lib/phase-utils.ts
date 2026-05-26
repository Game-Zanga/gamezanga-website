import { JAM_CONFIG } from "./jam-config";

export type Phase =
  | "pre_registration"
  | "registration"
  | "suggestion"
  | "voting"
  | "announced"
  | "jam_active"
  | "jam_ended";

export function getCurrentPhase(now: Date = new Date()): Phase {
  const t = now.getTime();
  const regOpen = new Date(JAM_CONFIG.registration_open).getTime();
  const sugOpen = new Date(JAM_CONFIG.suggestion_open).getTime();
  const sugClose = new Date(JAM_CONFIG.suggestion_close).getTime();
  const voteOpen = new Date(JAM_CONFIG.voting_open).getTime();
  const voteClose = new Date(JAM_CONFIG.voting_close).getTime();
  const themeAnnounced = new Date(JAM_CONFIG.theme_announced).getTime();
  const jamStart = new Date(JAM_CONFIG.jam_start).getTime();
  const jamEnd = new Date(JAM_CONFIG.jam_end).getTime();

  if (t < regOpen) return "pre_registration";
  if (t >= jamEnd) return "jam_ended";
  if (t >= jamStart) return "jam_active";
  if (t >= themeAnnounced) return "announced";
  if (t >= voteOpen && t < voteClose) return "voting";
  if (t >= sugOpen && t < sugClose) return "suggestion";
  return "registration";
}

export function isRegistrationOpen(now: Date = new Date()): boolean {
  const t = now.getTime();
  return (
    t >= new Date(JAM_CONFIG.registration_open).getTime() &&
    t < new Date(JAM_CONFIG.registration_close).getTime()
  );
}

export function isSuggestionOpen(now: Date = new Date()): boolean {
  const t = now.getTime();
  return (
    t >= new Date(JAM_CONFIG.suggestion_open).getTime() &&
    t < new Date(JAM_CONFIG.suggestion_close).getTime()
  );
}

export function isVotingOpen(now: Date = new Date()): boolean {
  const t = now.getTime();
  return (
    t >= new Date(JAM_CONFIG.voting_open).getTime() &&
    t < new Date(JAM_CONFIG.voting_close).getTime()
  );
}

export function isThemeAnnounced(now: Date = new Date()): boolean {
  return now.getTime() >= new Date(JAM_CONFIG.theme_announced).getTime();
}

// Time until target in {days, hours, minutes, seconds}. All zeros once target has passed.
export function timeUntil(target: string | Date, now: Date = new Date()) {
  const ms = new Date(target).getTime() - now.getTime();
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return { days, hours, minutes, seconds, done: false };
}

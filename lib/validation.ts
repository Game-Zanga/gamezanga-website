// Server-side input validation for the registration form. Defensive — assumes nothing.

export const AGE_GROUPS = ["under_18", "18_22", "23_29", "30_39", "over_40"] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number];

export const SKILLS = ["programming", "art", "design", "audio", "other"] as const;
export type Skill = (typeof SKILLS)[number];

export type RegisterInput = {
  full_name: string;
  email: string;
  mobile?: string;
  gender?: "male" | "female";
  age_group: AgeGroup;
  country: string;
  country_other?: string;
  skills: Skill[];
  skills_other?: string;
  participated_before: boolean;
};

// Errors carry a translation code; the client renders it in the chosen locale.
export type ValidationError = { field: string; code: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(body: unknown): { data?: RegisterInput; errors?: ValidationError[] } {
  const errors: ValidationError[] = [];
  const b = (body ?? {}) as Record<string, unknown>;

  const full_name = typeof b.full_name === "string" ? b.full_name.trim() : "";
  if (full_name.length < 3) errors.push({ field: "full_name", code: "err_full_name_short" });
  else if (full_name.split(/\s+/).length < 2) errors.push({ field: "full_name", code: "err_full_name_two_parts" });

  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) errors.push({ field: "email", code: "err_invalid_email" });

  const mobile = typeof b.mobile === "string" ? b.mobile.trim() : "";
  if (mobile && mobile.length > 32) errors.push({ field: "mobile", code: "err_mobile_long" });

  const genderRaw = typeof b.gender === "string" ? b.gender : "";
  const gender = genderRaw === "male" || genderRaw === "female" ? genderRaw : undefined;

  const age_group = b.age_group as AgeGroup;
  if (!AGE_GROUPS.includes(age_group)) errors.push({ field: "age_group", code: "err_invalid_age" });

  const country = typeof b.country === "string" ? b.country : "";
  if (country.length === 0 || country.length > 64) errors.push({ field: "country", code: "err_country_required" });
  const country_other = typeof b.country_other === "string" ? b.country_other.trim() : "";
  if (country === "Other" && country_other.length === 0) errors.push({ field: "country_other", code: "err_country_other_required" });

  const skillsRaw = Array.isArray(b.skills) ? (b.skills as unknown[]) : [];
  const skills = skillsRaw.filter((s): s is Skill => typeof s === "string" && (SKILLS as readonly string[]).includes(s as string));
  if (skills.length === 0) errors.push({ field: "skills", code: "err_select_skill" });
  const skills_other = typeof b.skills_other === "string" ? b.skills_other.trim() : "";
  if (skills.includes("other") && skills_other.length === 0) errors.push({ field: "skills_other", code: "err_skill_other_required" });

  const participated_before =
    typeof b.participated_before === "boolean"
      ? b.participated_before
      : b.participated_before === "yes" || b.participated_before === "true"
      ? true
      : b.participated_before === "no" || b.participated_before === "false"
      ? false
      : null;
  if (participated_before === null) errors.push({ field: "participated_before", code: "err_participated_required" });

  if (errors.length) return { errors };

  return {
    data: {
      full_name,
      email,
      mobile: mobile || undefined,
      gender,
      age_group,
      country,
      country_other: country === "Other" ? country_other : undefined,
      skills,
      skills_other: skills.includes("other") ? skills_other : undefined,
      participated_before: participated_before as boolean,
    },
  };
}

export type Locale = "ar" | "en";

export const LOCALE_COOKIE = "gz_locale";
export const DEFAULT_LOCALE: Locale = "ar";

export const dir = (l: Locale) => (l === "ar" ? "rtl" : "ltr");

export const t = {
  // Nav
  nav_home: { ar: "الرئيسية", en: "Home" },
  nav_about: { ar: "عن الزنقة", en: "About" },
  nav_rules: { ar: "القوانين", en: "Rules" },
  nav_register: { ar: "التسجيل", en: "Register" },
  nav_suggest: { ar: "اقتراح ثيم", en: "Suggest" },
  nav_vote: { ar: "التصويت", en: "Vote" },
  nav_admin: { ar: "الإدارة", en: "Admin" },
  lang_toggle: { ar: "EN", en: "ع" },

  // Home
  edition_label: { ar: "النسخة", en: "Edition" },
  countdown_to_jam: { ar: "العد التنازلي لانطلاق الزنقة", en: "Countdown to Jam Start" },
  ksa_time: { ar: "بتوقيت السعودية", en: "Saudi Time (UTC+3)" },
  cta_register_now: { ar: "سجّل الآن", en: "Register Now" },
  cta_view_rules: { ar: "اطلع على القوانين", en: "Read the Rules" },
  steps_heading: { ar: "كيف تشارك؟", en: "How to Participate" },
  step1_title: { ar: "سجّل", en: "Register" },
  step2_title: { ar: "اقترح وصوّت", en: "Suggest & Vote" },
  step3_title: { ar: "سجّل في itch.io", en: "Register on itch.io" },
  step4_title: { ar: "انضم للمجتمع", en: "Join the Community" },

  about_heading: { ar: "عن زنقة الألعاب", en: "About Game Zanga" },
  about_body: {
    ar: "زنقة الألعاب هي فعالية عربية لتطوير الألعاب تستمر لمدة ٧٢ ساعة. تقام مرة في السنة وتجمع المطورين والفنانين والمصممين والموسيقيين من جميع أنحاء الوطن العربي للتعاون عن بُعد وبناء ألعاب حول ثيم يُكشف لحظة الانطلاق.",
    en: "Game Zanga is a 72-hour Arabic-language game jam held once a year. It brings together developers, artists, designers, and musicians from across the Arab world to collaborate remotely and build games around a theme revealed at jam start.",
  },

  judging_heading: { ar: "معايير التحكيم", en: "Judging Criteria" },
  jc_theme: { ar: "الالتزام بالثيم", en: "Theme Adherence" },
  jc_theme_body: { ar: "كيف وظّفت اللعبة الثيم؟", en: "How well does the game use the theme?" },
  jc_fun: { ar: "المتعة", en: "Fun Factor" },
  jc_fun_body: { ar: "هل اللعبة ممتعة وسهلة التحكم؟", en: "Is it enjoyable, with good controls?" },
  jc_creativity: { ar: "الإبداع", en: "Creativity" },
  jc_creativity_body: { ar: "هل الفكرة أصلية وغير متوقعة؟", en: "Is the idea original and unexpected?" },
  jc_visuals: { ar: "الرسومات", en: "Visuals" },
  jc_visuals_body: { ar: "جودة الفن والإخراج البصري.", en: "Art quality and direction." },
  jc_audio: { ar: "الصوت", en: "Audio" },
  jc_audio_body: { ar: "جودة المؤثرات الصوتية والموسيقى.", en: "Sound effects and music quality." },

  partners_heading: { ar: "الشركاء", en: "Partners" },
  media_partners_heading: { ar: "الشركاء الإعلاميون", en: "Media Partners" },
  partners_placeholder: { ar: "قريباً...", en: "Coming soon..." },

  // Footer
  footer_built_by: { ar: "صُنع بحب لمجتمع الألعاب العربي", en: "Built with love for the Arab game dev community" },
  follow_us: { ar: "تابعنا", en: "Follow us" },

  // Forms — common
  submit: { ar: "إرسال", en: "Submit" },
  submitting: { ar: "جارٍ الإرسال...", en: "Submitting..." },
  required: { ar: "حقل مطلوب", en: "Required" },
  optional: { ar: "اختياري", en: "Optional" },

  // Register
  register_heading: { ar: "التسجيل في زنقة الألعاب", en: "Register for Game Zanga" },
  register_intro: { ar: "املأ النموذج أدناه. سنرسل تأكيداً على بريدك.", en: "Fill out the form below. A confirmation will be sent to your email." },
  register_closed: { ar: "التسجيل مغلق حالياً.", en: "Registration is currently closed." },
  register_team_note: {
    ar: "ملاحظة مهمة: إذا كان لديك فريق يجب على كل أعضاء الفريق التسجيل للمشاركة في الزنقة.",
    en: "Important note: If you have a team, every team member must register individually to participate in the jam.",
  },
  register_success: { ar: "تم التسجيل بنجاح! تحقق من بريدك للتأكيد.", en: "Registered successfully! Check your email for confirmation." },
  field_full_name: { ar: "الاسم الكامل", en: "Full Name" },
  field_full_name_hint: { ar: "يجب إدخال الاسم الحقيقي من مقطعين", en: "Real name, two parts (first + family)" },
  field_email: { ar: "البريد الإلكتروني", en: "Email" },
  field_email_hint: { ar: "هو الوسيلة الرئيسية للتواصل", en: "Primary means of communication" },
  field_mobile: { ar: "رقم الموبايل", en: "Mobile Number" },
  field_gender: { ar: "الجنس", en: "Gender" },
  gender_male: { ar: "ذكر", en: "Male" },
  gender_female: { ar: "أنثى", en: "Female" },
  field_age: { ar: "الفئة العمرية", en: "Age Group" },
  age_under_18: { ar: "أقل من ١٨", en: "Under 18" },
  age_18_22: { ar: "١٨-٢٢", en: "18-22" },
  age_23_29: { ar: "٢٣-٢٩", en: "23-29" },
  age_30_39: { ar: "٣٠-٣٩", en: "30-39" },
  age_over_40: { ar: "أكثر من ٤٠", en: "Over 40" },
  field_country: { ar: "البلد", en: "Country" },
  field_country_other: { ar: "حدد البلد", en: "Specify country" },
  field_skills: { ar: "تُبدع في", en: "Skilled in" },
  skill_programming: { ar: "البرمجة", en: "Programming" },
  skill_art: { ar: "الرسم", en: "Art" },
  skill_design: { ar: "تصميم الألعاب", en: "Game Design" },
  skill_audio: { ar: "المؤثرات الصوتية", en: "Sound FX & Music" },
  skill_other: { ar: "أخرى", en: "Other" },
  field_skills_other: { ar: "حدد المهارة", en: "Specify skill" },
  field_participated_before: { ar: "هل شاركت في زنقة الألعاب من قبل؟", en: "Have you participated in Game Zanga before?" },
  yes: { ar: "نعم", en: "Yes" },
  no: { ar: "لا", en: "No" },
  country_other_label: { ar: "أخرى", en: "Other" },

  // Rules / FAQ
  rules_heading: { ar: "القوانين والأسئلة الشائعة", en: "Rules & FAQ" },
  rules_submission_heading: { ar: "قوانين تسليم الألعاب", en: "Game Submission Rules" },
  rules_general_heading: { ar: "القوانين العامة", en: "General Rules" },
  faq_heading: { ar: "الأسئلة الشائعة", en: "Frequently Asked Questions" },

  // Suggest / Vote
  suggest_heading: { ar: "اقتراح الثيمات", en: "Suggest Themes" },
  suggest_intro_ar: { ar: "اقترح حتى ٣ ثيمات.", en: "Suggest up to 3 themes." },
  suggest_closed: { ar: "اقتراح الثيمات مغلق حالياً.", en: "Theme suggestions are currently closed." },
  suggest_must_login: { ar: "يجب تسجيل الدخول أولاً.", en: "You must sign in first." },
  suggest_must_register: { ar: "يجب أن تكون مسجلاً في الزنقة.", en: "You must be registered for the jam." },
  suggest_label_ar: { ar: "الثيم بالعربية", en: "Theme (Arabic)" },
  suggest_label_en: { ar: "الثيم بالإنجليزية (اختياري)", en: "Theme (English, optional)" },
  suggest_submitted: { ar: "تم استلام اقتراحاتك.", en: "Your suggestions were received." },
  suggest_remaining: { ar: "متبقي لك", en: "Remaining" },

  vote_heading: { ar: "التصويت على الثيمات", en: "Vote on Themes" },
  vote_intro: {
    ar: "صوّت على كل ثيم في القائمة أدناه. يمكنك تغيير تصويتك في أي وقت خلال فترة التصويت.",
    en: "Vote on each theme below. You can change your vote any time during the voting window.",
  },
  vote_not_started: { ar: "التصويت لم يبدأ للأن.", en: "Voting hasn't started yet." },
  vote_closed: { ar: "التصويت مغلق حالياً.", en: "Voting is currently closed." },
  vote_submitted: { ar: "تم تسجيل تصويتك.", en: "Your vote has been recorded." },
  vote_results: { ar: "النتائج الحالية", en: "Current Results" },
  vote_score: { ar: "النتيجة", en: "Score" },
  vote_voters: { ar: "المصوّتون", en: "Voters" },
  vote_positive: { ar: "نعم", en: "Yes" },
  vote_neutral: { ar: "محايد", en: "Neutral" },
  vote_negative: { ar: "لا", en: "No" },
  vote_yes_help: { ar: "اختر نعم إن كنت تريد زيادة فرصة فوز الثيم", en: "Choose Yes if you want this theme to win" },
  vote_neutral_help: { ar: "اختر محايد إن لم يعجبك الثيم لكنك تفضله عن غيره", en: "Choose Neutral if you don't like it but prefer it over others" },
  vote_no_help: { ar: "اختر لا إن كنت تريد زيادة فرصة فشل الثيم", en: "Choose No if you want this theme to fail" },
  theme_winner: { ar: "الثيم الفائز", en: "Winning Theme" },

  // Auth
  auth_heading: { ar: "تسجيل الدخول", en: "Sign In" },
  auth_intro: { ar: "أدخل بريدك المسجّل وسنرسل لك رابط دخول.", en: "Enter your registered email and we'll send you a sign-in link." },
  auth_send_link: { ar: "أرسل الرابط", en: "Send Link" },
  auth_link_sent: { ar: "تم إرسال الرابط. تحقق من بريدك.", en: "Link sent. Check your email." },
  auth_verifying: { ar: "جارٍ التحقق...", en: "Verifying..." },
  auth_signed_in_as: { ar: "أنت مسجّل بـ", en: "Signed in as" },
  auth_sign_out: { ar: "تسجيل الخروج", en: "Sign Out" },

  // Admin
  admin_heading: { ar: "لوحة الإدارة", en: "Admin Panel" },
  admin_login_prompt: { ar: "أدخل كلمة المرور الإدارية", en: "Enter admin secret" },
  admin_login: { ar: "دخول", en: "Login" },
  admin_logout: { ar: "خروج", en: "Logout" },
  admin_registrations: { ar: "المسجّلون", en: "Registrations" },
  admin_export_csv: { ar: "تصدير CSV", en: "Export CSV" },
  admin_suggestions: { ar: "الاقتراحات", en: "Suggestions" },
  admin_approve: { ar: "اعتماد", en: "Approve" },
  admin_reject: { ar: "رفض", en: "Reject" },
  admin_set_winner: { ar: "إعلان الثيم الفائز", en: "Announce Winning Theme" },
  admin_broadcast: { ar: "بث رسالة", en: "Broadcast Email" },
  admin_subject: { ar: "الموضوع", en: "Subject" },
  admin_message: { ar: "الرسالة", en: "Message" },
  admin_send: { ar: "إرسال", en: "Send" },
  admin_live_results: { ar: "النتائج المباشرة", en: "Live Results" },
  admin_live_results_note: {
    ar: "للمشرفين فقط — هذه النتائج غير معروضة للمصوّتين",
    en: "Admin-only — these results are hidden from voters",
  },
  admin_refresh: { ar: "تحديث", en: "Refresh" },
  admin_set_as_winner: { ar: "اجعله الفائز", en: "Set as winner" },
  admin_total_voters: { ar: "إجمالي المصوّتين", en: "Total voters" },
  admin_no_votes_yet: { ar: "لا توجد أصوات بعد", en: "No votes yet" },

  // Generic errors
  err_generic:                  { ar: "حدث خطأ ما، حاول مجدداً", en: "Something went wrong, please try again" },
  err_network:                  { ar: "تعذر الاتصال بالخادم", en: "Could not reach the server" },
  err_invalid_json:             { ar: "بيانات غير صالحة", en: "Invalid data" },
  err_unauthorized:             { ar: "غير مصرّح", en: "Unauthorized" },

  // Registration / validation
  err_registration_closed:      { ar: "التسجيل مغلق حالياً", en: "Registration is closed" },
  err_email_already_registered: { ar: "هذا البريد مسجّل مسبقاً", en: "This email is already registered" },
  err_save_failed:              { ar: "تعذر حفظ التسجيل، حاول مجدداً", en: "Could not save your registration, please try again" },
  err_full_name_short:          { ar: "الاسم قصير جداً", en: "Name is too short" },
  err_full_name_two_parts:      { ar: "أدخل الاسم الحقيقي من مقطعين (اسمك واسم العائلة)", en: "Please enter both first and family name" },
  err_invalid_email:            { ar: "بريد إلكتروني غير صالح", en: "Invalid email" },
  err_mobile_long:              { ar: "رقم الموبايل طويل جداً", en: "Mobile number is too long" },
  err_invalid_age:              { ar: "الفئة العمرية غير صالحة", en: "Invalid age group" },
  err_country_required:         { ar: "البلد مطلوب", en: "Country is required" },
  err_country_other_required:   { ar: "حدد البلد", en: "Specify your country" },
  err_select_skill:             { ar: "اختر مهارة واحدة على الأقل", en: "Select at least one skill" },
  err_skill_other_required:     { ar: "حدد المهارة الأخرى", en: "Specify the other skill" },
  err_participated_required:    { ar: "حقل مطلوب", en: "Required" },

  // Suggest
  err_suggestions_closed:       { ar: "اقتراح الثيمات مغلق حالياً", en: "Suggestions are closed" },
  err_signin_required:          { ar: "يجب تسجيل الدخول أولاً", en: "Sign in required" },
  err_theme_length:             { ar: "الثيم يجب أن يكون بين ٢ و١٢٠ حرفاً", en: "Theme must be 2–120 characters" },
  err_must_be_registered:       { ar: "يجب أن تكون مسجلاً في هذه النسخة لاستخدام هذه الصفحة", en: "You must be registered for this edition" },
  err_suggestion_limit:         { ar: "وصلت للحد الأقصى من الاقتراحات", en: "You've reached the suggestion limit" },
  err_save_suggestion_failed:   { ar: "تعذر حفظ الاقتراح، حاول مجدداً", en: "Could not save the suggestion" },

  // Vote
  err_voting_closed:            { ar: "التصويت مغلق حالياً", en: "Voting is closed" },
  err_missing_theme:            { ar: "اختر ثيماً", en: "Pick a theme" },
  err_invalid_theme:            { ar: "ثيم غير صالح", en: "Invalid theme" },
  err_invalid_vote_value:       { ar: "قيمة تصويت غير صالحة", en: "Invalid vote value" },
  err_save_vote_failed:         { ar: "تعذر حفظ التقييم، حاول مجدداً", en: "Could not save your rating" },

  // Auth
  err_send_link_failed:         { ar: "تعذر إرسال رابط الدخول", en: "Could not send the sign-in link" },
  err_not_registered_signin:    { ar: "هذا البريد ليس مسجلاً في الزنقة. سجّل أولاً من صفحة التسجيل.", en: "This email is not registered for the jam. Please register first." },
  err_rate_limited:             { ar: "حاولت كثيراً بسرعة. الرجاء الانتظار دقيقة ثم إعادة المحاولة.", en: "Too many attempts. Please wait a minute and try again." },
  err_bad_origin:               { ar: "طلب غير صالح", en: "Invalid request origin" },
  err_maintenance:              { ar: "التسجيل متوقف مؤقتاً للصيانة. يرجى المحاولة لاحقاً.", en: "Registration temporarily paused for maintenance. Please try again later." },
} as const;

export type TranslationKey = keyof typeof t;

export function tr(key: TranslationKey, locale: Locale): string {
  return t[key][locale];
}

// Look up an error code that came from the API. Falls back to err_generic.
export function trCode(code: string | undefined | null, locale: Locale): string {
  if (code && (code in t)) {
    return t[code as TranslationKey][locale];
  }
  return t.err_generic[locale];
}

// Country list — value is the canonical English code, label is bilingual.
export const COUNTRIES = [
  { value: "Jordan", ar: "الأردن", en: "Jordan" },
  { value: "UAE", ar: "الإمارات", en: "UAE" },
  { value: "Bahrain", ar: "البحرين", en: "Bahrain" },
  { value: "Algeria", ar: "الجزائر", en: "Algeria" },
  { value: "KSA", ar: "السعودية", en: "Saudi Arabia" },
  { value: "Sudan", ar: "السودان", en: "Sudan" },
  { value: "Somalia", ar: "الصومال", en: "Somalia" },
  { value: "Iraq", ar: "العراق", en: "Iraq" },
  { value: "Kuwait", ar: "الكويت", en: "Kuwait" },
  { value: "Morocco", ar: "المغرب", en: "Morocco" },
  { value: "Yemen", ar: "اليمن", en: "Yemen" },
  { value: "Tunisia", ar: "تونس", en: "Tunisia" },
  { value: "Djibouti", ar: "جيبوتي", en: "Djibouti" },
  { value: "Syria", ar: "سوريا", en: "Syria" },
  { value: "Oman", ar: "عُمان", en: "Oman" },
  { value: "Palestine", ar: "فلسطين", en: "Palestine" },
  { value: "Qatar", ar: "قطر", en: "Qatar" },
  { value: "Lebanon", ar: "لبنان", en: "Lebanon" },
  { value: "Libya", ar: "ليبيا", en: "Libya" },
  { value: "Egypt", ar: "مصر", en: "Egypt" },
  { value: "Mauritania", ar: "موريتانيا", en: "Mauritania" },
  { value: "Other", ar: "أخرى", en: "Other" },
] as const;

// Build an editable .docx of the Game Zanga media kit (docs/media-kit.html).
//
// Deliberate departures from the HTML:
//  - Light "ink on paper" palette, matching the file's own @media print rules.
//    A dark-background Word file is unusable to edit and wastes toner to print.
//  - The CSS bar charts become real tables. Bars can't survive the trip, and a
//    table is what you'd actually want to edit in Google Docs anyway.
//  - Arabic is the document direction (bidirectional paragraphs + RTL runs);
//    English blocks are explicit LTR islands, same as the HTML.

import fs from "node:fs";
import {
  AlignmentType, BorderStyle, Document, ExternalHyperlink, Footer, HeadingLevel,
  ImageRun, LevelFormat, Packer, PageNumber, Paragraph, Table,
  TableCell, TableRow, TextRun, VerticalAlign, WidthType,
} from "docx";

const FONT = "Cairo";
const INK = "1A1A24";
const MUTED = "55556A";
const FAINT = "8A8A9E";
const ACCENT = "7B2CBF";   // darkened brand purple — #b347ff is too light on white
const ACCENT2 = "C2410C";
const HAIR = "D8D8E4";
// No panel/zebra fills anywhere — the document is white throughout and gets its
// structure from hairline rules alone. Shaded blocks in a Word file also fight
// with whatever the editor pastes in later.

const MARGIN = 1080;                 // 0.75"
const CONTENT = 11906 - MARGIN * 2;  // A4 width minus margins = 9746 DXA

const ar = (text, o = {}) => new TextRun({ text, font: FONT, rightToLeft: true, color: INK, size: 22, ...o });
const en = (text, o = {}) => new TextRun({ text, font: FONT, color: MUTED, size: 19, ...o });

const arP = (text, o = {}) =>
  new Paragraph({ bidirectional: true, alignment: AlignmentType.JUSTIFIED, spacing: { after: 140, line: 320 },
    children: [ar(text, o.run)], ...o.par });

const enP = (text, o = {}) =>
  new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 120, line: 300 },
    children: [en(text, o.run)], ...o.par });

const spacer = (h = 120) => new Paragraph({ spacing: { after: h }, children: [] });

/** Section heading: Arabic title, English label beneath, accent rule under both. */
function h2(arabic, english) {
  return [
    new Paragraph({
      bidirectional: true, heading: HeadingLevel.HEADING_1,
      spacing: { before: 340, after: 40 },
      children: [ar(arabic, { bold: true, size: 30, color: INK })],
    }),
    new Paragraph({
      spacing: { after: 160 },
      alignment: AlignmentType.RIGHT,
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, space: 6, color: ACCENT } },
      children: [en(english.toUpperCase(), { size: 16, bold: true, color: ACCENT, characterSpacing: 30 })],
    }),
  ];
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 90 },
    children: [new TextRun({ text, font: FONT, bold: true, size: 23, color: ACCENT })],
  });
}

const cell = (children, { w, vAlign, borders } = {}) =>
  new TableCell({
    width: { size: w, type: WidthType.DXA },
    verticalAlign: vAlign ?? VerticalAlign.CENTER,
    margins: { top: 90, bottom: 90, left: 120, right: 120 },
    borders,
    children,
  });

// Header cells carry the accent as a rule underneath rather than as a filled bar.
const HEADER_BORDERS = {
  bottom: { style: BorderStyle.SINGLE, size: 12, color: ACCENT },
};

/** Data table replacing one of the HTML bar charts. */
function chartTable({ head, rows, widths }) {
  const total = widths.reduce((a, b) => a + b, 0);
  const headRow = new TableRow({
    tableHeader: true,
    children: head.map((h, i) =>
      cell([new Paragraph({
        bidirectional: i === 0, alignment: i === 0 ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [new TextRun({ text: h, font: FONT, bold: true, size: 18, color: ACCENT, rightToLeft: i === 0 })],
      })], { w: widths[i], borders: HEADER_BORDERS })),
  });

  const bodyRows = rows.map((r) =>
    new TableRow({
      children: r.map((v, i) =>
        cell([new Paragraph({
          bidirectional: i === 0,
          alignment: i === 0 ? AlignmentType.RIGHT : AlignmentType.LEFT,
          children: [new TextRun({
            text: String(v), font: FONT, size: 20, rightToLeft: i === 0,
            color: i === 0 ? INK : MUTED, bold: i === 1,
          })],
        })], { w: widths[i] })),
    }));

  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    visuallyRightToLeft: true,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: HAIR },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: HAIR },
      left: { style: BorderStyle.NONE, size: 0, color: "auto" },
      right: { style: BorderStyle.NONE, size: 0, color: "auto" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: HAIR },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
    },
    rows: [headRow, ...bodyRows],
  });
}

/** The big-number "at a glance" strip. */
function statStrip(stats) {
  const w = Math.floor(CONTENT / stats.length);
  const widths = stats.map((_, i) => (i === stats.length - 1 ? CONTENT - w * (stats.length - 1) : w));
  return new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: widths,
    visuallyRightToLeft: true,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: HAIR },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: HAIR },
      left: { style: BorderStyle.NONE, size: 0, color: "auto" },
      right: { style: BorderStyle.NONE, size: 0, color: "auto" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: HAIR },
    },
    rows: [new TableRow({
      children: stats.map((s, i) => cell([
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 },
          children: [new TextRun({ text: s.n, font: FONT, bold: true, size: 40, color: ACCENT })] }),
        new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER, spacing: { after: 10 },
          children: [ar(s.ar, { size: 18 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER,
          children: [en(s.en, { size: 15, color: FAINT })] }),
      ], { w: widths[i] })),
    })],
  });
}

/** Offer bullet: bold bilingual title, English detail underneath. */
function offer(title, detail) {
  return [
    new Paragraph({
      bidirectional: true, numbering: { reference: "offers", level: 0 },
      spacing: { before: 120, after: 40 },
      children: [ar(title, { bold: true, size: 21 })],
    }),
    new Paragraph({
      indent: { left: 460, right: 460 }, spacing: { after: 60 },
      children: [en(detail, { size: 19 })],
    }),
  ];
}

const logo = fs.readFileSync(new URL("./logo-print.png", import.meta.url));

const doc = new Document({
  background: { color: "FFFFFF" },
  creator: "Game Zanga",
  title: "Game Zanga — Media Kit 2026",
  description: "ملف تعريفي / Media Kit — Game Zanga Edition 14",
  styles: {
    default: {
      document: { run: { font: FONT, size: 22, color: INK } },
      heading1: { run: { font: FONT, bold: true, size: 30, color: INK } },
      heading2: { run: { font: FONT, bold: true, size: 23, color: ACCENT } },
    },
  },
  numbering: {
    config: [{
      reference: "offers",
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.START,
        style: { paragraph: { indent: { left: 340, hanging: 200 } } },
      }],
    }],
  },
  sections: [{
    properties: { page: { margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({
            text: "gamezanga.net  ·  ", font: FONT, size: 16, color: FAINT,
          }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: FAINT })],
        })],
      }),
    },
    children: [
      // ---------- masthead ----------
      new Paragraph({
        alignment: AlignmentType.RIGHT, spacing: { after: 200 },
        children: [new ImageRun({ data: logo, type: "png", transformation: { width: 360, height: 74 } })],
      }),
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { after: 100 },
        children: [ar("ملف تعريفي", { bold: true, size: 17, color: ACCENT }),
                   en("  ·  MEDIA KIT  ·  2026", { bold: true, size: 16, color: ACCENT })],
      }),
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { after: 100 },
        children: [ar("أكبر تجمّع سنوي لمطوّري الألعاب العرب", { bold: true, size: 40 })],
      }),
      enP("The largest annual gathering of Arab game developers — a 72-hour game jam running since 2011.",
          { run: { size: 21, italics: true }, par: { alignment: AlignmentType.LEFT, spacing: { after: 140 } } }),
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { after: 60 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 12, space: 8, color: ACCENT2 } },
        children: [
          ar("النسخة الرابعة عشرة", { size: 19, color: MUTED }),
          en("  ·  Edition 14  ·  13–16 August 2026  ·  gamezanga.net", { size: 18, bold: true, color: MUTED }),
        ],
      }),
      spacer(160),

      // ---------- who we are ----------
      ...h2("من نحن", "Who we are"),
      arP("زنقة الألعاب فعالية عربية لتطوير الألعاب انطلقت عام ٢٠١١، وتُقام مرة واحدة سنوياً على مدى ٧٢ ساعة متواصلة. يبني فيها المشاركون — أفراداً وفرقاً — لعبة كاملة من الصفر انطلاقاً من ثيم سرّي يُكشف لحظة البداية، ثم يلعب الجميع أعمال بعضهم ويتبادلون التقييم والملاحظات."),
      arP("على مدى خمسة عشر عاماً أقمنا أربع عشرة نسخة، وبنينا واحدة من أقدم وأكبر مجتمعات تطوير الألعاب الناطقة بالعربية. الفعالية أونلاين بالكامل عبر Discord و itch.io، ومجانية للمشاركين."),
      spacer(60),
      enP("Game Zanga is an Arabic-language game jam founded in 2011 and held once a year over 72 continuous hours. Participants — solo and in teams — build a complete game from scratch around a secret theme revealed at the start, then play and rate each other's submissions."),
      enP("Across fifteen years we have run fourteen editions and built one of the oldest and largest Arabic-speaking game development communities. The event is fully online via Discord and itch.io, and free to enter."),

      // ---------- at a glance ----------
      ...h2("أرقام سريعة", "At a glance"),
      statStrip([
        { n: "15", ar: "سنة منذ ٢٠١١", en: "years running" },
        { n: "14", ar: "نسخة أُقيمت", en: "editions held" },
        { n: "2,343", ar: "مطوّر مسجّل", en: "registered developers" },
        { n: "18", ar: "دولة عربية", en: "Arab countries" },
        { n: "72", ar: "ساعة لكل نسخة", en: "hours per edition" },
      ]),
      spacer(),

      // ---------- growth ----------
      ...h2("التسجيل حسب النسخة", "Registrations by edition"),
      chartTable({
        head: ["النسخة  ·  Edition", "المسجّلون  ·  Registered", "الحالة  ·  Status"],
        widths: [4200, 2600, 2946],
        rows: [
          ["النسخة ١٢  ·  Edition 12 · 2023", "555", "مكتملة · completed"],
          ["النسخة الخاصة  ·  Special Ed. · 2024", "962", "مكتملة · completed"],
          ["النسخة ١٣  ·  Edition 13 · 2025", "890", "مكتملة · completed"],
          ["النسخة ١٤  ·  Edition 14 · 2026", "341", "التسجيل مفتوح · still open"],
        ],
      }),
      spacer(),

      // ---------- geography ----------
      ...h2("من أين يأتي المشاركون", "Where participants come from"),
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { after: 120 },
        children: [ar("أعلى ١٢ دولة", { bold: true, size: 20 }),
                   en("  ·  Top 12 countries — share of 2,343 registered developers", { size: 17 })],
      }),
      chartTable({
        head: ["الدولة  ·  Country", "العدد  ·  Count", "النسبة  ·  Share"],
        widths: [4600, 2400, 2746],
        rows: [
          ["الأردن  ·  Jordan", "558", "23.8%"], ["مصر  ·  Egypt", "490", "20.9%"],
          ["السعودية  ·  Saudi Arabia", "465", "19.8%"], ["العراق  ·  Iraq", "164", "7.0%"],
          ["الجزائر  ·  Algeria", "114", "4.9%"], ["لبنان  ·  Lebanon", "106", "4.5%"],
          ["المغرب  ·  Morocco", "101", "4.3%"], ["فلسطين  ·  Palestine", "83", "3.5%"],
          ["سوريا  ·  Syria", "54", "2.3%"], ["السودان  ·  Sudan", "44", "1.9%"],
          ["الإمارات  ·  UAE", "31", "1.3%"], ["تونس  ·  Tunisia", "30", "1.3%"],
        ],
      }),
      spacer(80),
      enP("Reach spans 18 Arab countries with a concentrated core in the Levant, Egypt and the Gulf, plus diaspora participants in Europe, North America and Asia."),

      // ---------- audience ----------
      ...h2("من هم المشاركون", "Who they are"),
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { after: 120 },
        children: [ar("الفئة العمرية", { bold: true, size: 20 }), en("  ·  Age group", { size: 17 })],
      }),
      chartTable({
        head: ["الفئة  ·  Age group", "العدد  ·  Count", "النسبة  ·  Share"],
        widths: [4600, 2400, 2746],
        rows: [
          ["أقل من ١٨  ·  Under 18", "547", "23.3%"], ["١٨–٢٢  ·  18–22", "789", "33.7%"],
          ["٢٣–٢٩  ·  23–29", "756", "32.3%"], ["٣٠–٣٩  ·  30–39", "221", "9.4%"],
          ["أكثر من ٤٠  ·  Over 40", "30", "1.3%"],
        ],
      }),
      spacer(160),
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { after: 120 },
        children: [ar("المهارات", { bold: true, size: 20 }), en("  ·  Skills", { size: 17 })],
      }),
      chartTable({
        head: ["المهارة  ·  Skill", "العدد  ·  Count", "النسبة  ·  Share"],
        widths: [4600, 2400, 2746],
        rows: [
          ["البرمجة  ·  Programming", "1694", "72.3%"], ["تصميم الألعاب  ·  Game design", "1315", "56.1%"],
          ["الرسم  ·  Art", "725", "30.9%"], ["الصوت والمؤثرات  ·  Audio & SFX", "280", "12.0%"],
          ["أخرى  ·  Other", "183", "7.8%"],
        ],
      }),
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.RIGHT,
        spacing: { before: 120, after: 60 },
        indent: { right: 200 },
        border: { right: { style: BorderStyle.SINGLE, size: 12, space: 8, color: ACCENT2 } },
        children: [ar("هذا السؤال متعدّد الاختيار — المشارك الواحد يختار كل ما يجيده، لذا يتجاوز مجموع النسب ١٠٠٪. المعدّل ١٫٨ مهارة لكل مشارك، و٥٤٪ منهم يعملون في أكثر من تخصّص.", { size: 19 })],
      }),
      enP("Multi-select — each person ticks every skill they have, so these shares total 179%, not 100%. The average is 1.8 skills per participant, and 54% work across more than one discipline.",
          { run: { size: 18, italics: true } }),
      spacer(100),
      statStrip([
        { n: "89%", ar: "تحت سن الثلاثين", en: "under 30" },
        { n: "72%", ar: "مبرمجون", en: "programmers" },
        { n: "20%", ar: "مشاركات إناث", en: "women" },
        { n: "54%", ar: "أكثر من تخصّص", en: "multi-disciplinary" },
      ]),
      spacer(),

      // ---------- why partner ----------
      ...h2("لماذا الشراكة مع زنقة الألعاب", "Why partner with Game Zanga"),
      arP("جمهورنا ليس جمهوراً عاماً — إنهم مطوّرو ألعاب فعليون. ٧٢٪ منهم مبرمجون و٥٦٪ مصمّمون، وأغلبهم في بداية مسيرتهم المهنية، أي في المرحلة التي يختارون فيها الأدوات التي سيستمرون باستخدامها لسنوات."),
      enP("Our audience is not a general audience — they are working game developers. 72% write code, 56% design, and most are early in their careers: precisely the stage at which developers pick the tools they will keep using for years."),
      new Paragraph({
        bidirectional: true, heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.RIGHT, spacing: { before: 240, after: 100 },
        children: [ar("كيف تدخل أدوات Qwacks في الزنقة عملياً", { bold: true, size: 23, color: ACCENT }),
                   en("  ·  Where each tool would actually get used", { size: 17 })],
      }),
      h3("Dataduck — market research"),
      enP("Hour 0–3, deciding what to make. Teams pressure-test their reading of the theme against what already exists and see which genres are crowded — then come back to it later if a prototype looks worth turning into a real project.",
          { run: { color: INK } }),
      h3("Protokite — player testing"),
      enP("Hour 40 onward, and through rating. Teams push a build and watch where players actually get stuck while there is still time to fix it — instead of guessing from a handful of friends on Discord.",
          { run: { color: INK } }),
      h3("Flock — backend"),
      enP("The features teams cut on day one. Leaderboards, matchmaking and saved progress get dropped because nobody can stand up a server in 72 hours. With a ready-made backend they ship inside the jam instead.",
          { run: { color: INK } }),

      // ---------- collaboration ----------
      ...h2("صيَغ محتملة للتعاون", "Possible forms of collaboration"),
      arP("هذه نقاط انطلاق وليست باقات ثابتة — نحن منفتحون على الصيغة التي تناسب Qwacks أكثر."),
      enP("These are starting points rather than fixed packages — we are open to whatever shape fits Qwacks best."),
      ...offer("أدوات مجانية للمشاركين  ·  Free tooling for participants",
        "Credits or free access to Qwacks products for every registered developer, announced at the jam opening."),
      ...offer("جائزة برعاية  ·  Sponsored award category",
        "A dedicated prize — for example “Best use of Qwacks backend” — judged alongside the main criteria."),
      ...offer("ورشة أو جلسة تقنية  ·  Workshop or tech talk",
        "A live session on Discord during or before the jam, introducing the tools to an engaged developer audience."),
      ...offer("ظهور العلامة  ·  Brand presence",
        "Logo and link on gamezanga.net, the itch.io jam page, the Discord server, and social announcements."),
      ...offer("رعاية مالية  ·  Financial sponsorship",
        "Direct support for prizes and running costs, with visibility scaled accordingly."),

      // ---------- contact ----------
      ...h2("للتواصل", "Get in touch"),
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { after: 80 },
        children: [ar("دانر كيفي", { bold: true, size: 24 }), en("  ·  Danar Kayfi", { bold: true, size: 21 })],
      }),
      new Paragraph({
        spacing: { after: 60 }, alignment: AlignmentType.LEFT,
        children: [
          new ExternalHyperlink({ link: "mailto:danar.kayfi@gmail.com",
            children: [new TextRun({ text: "danar.kayfi@gmail.com", font: FONT, size: 20, color: ACCENT, underline: {} })] }),
          new TextRun({ text: "     +964 751 040 3301", font: FONT, size: 20, color: MUTED }),
        ],
      }),
      new Paragraph({
        spacing: { after: 200 }, alignment: AlignmentType.LEFT,
        children: [
          ...[["gamezanga.net", "https://www.gamezanga.net"],
              ["Discord", "https://discord.gg/xvxEPtrzgu"],
              ["itch.io", "https://itch.io/jam/gamezanga14"],
              ["@GameZanga", "https://twitter.com/GameZanga"]]
            .flatMap(([label, url], i) => [
              ...(i ? [new TextRun({ text: "   ·   ", font: FONT, size: 19, color: FAINT })] : []),
              new ExternalHyperlink({ link: url,
                children: [new TextRun({ text: label, font: FONT, size: 19, color: ACCENT, underline: {} })] }),
            ]),
        ],
      }),

      // ---------- footnote ----------
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { before: 200, after: 60 },
        border: { top: { style: BorderStyle.SINGLE, size: 6, space: 10, color: HAIR } },
        children: [ar("جميع الأرقام مستخرجة مباشرة من قاعدة بيانات التسجيل في gamezanga.net بتاريخ يوليو ٢٠٢٦. النِّسب المئوية محسوبة من إجمالي ٢٣٤٣ مطوّراً مسجّلاً. حقل المهارات متعدّد الاختيار، لذا يتجاوز مجموع نسبه ١٠٠٪.", { size: 17, color: FAINT })],
      }),
      enP("All figures are drawn directly from the gamezanga.net registration database as of July 2026. Percentages are of 2,343 unique registered developers. The skills field is multi-select, so its shares sum above 100%.",
          { run: { size: 16, color: FAINT } }),
    ],
  }],
});

const out = process.argv[2] ?? "Game-Zanga-Media-Kit-2026.docx";
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log(`wrote ${out} (${(buf.length / 1024).toFixed(1)} KB)`);
});

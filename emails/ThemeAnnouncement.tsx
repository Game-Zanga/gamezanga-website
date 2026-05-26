import { Heading, Text } from "@react-email/components";
import { JAM_CONFIG } from "@/lib/jam-config";
import { Bilingual, EmailShell } from "./_shared";

export default function ThemeAnnouncement({
  themeAr,
  themeEn,
}: {
  themeAr: string;
  themeEn?: string;
}) {
  return (
    <EmailShell preview={`الثيم: ${themeAr}`}>
      <Heading as="h2" style={{ fontSize: 22, margin: "0 0 16px", color: "#f5f5f7" }}>
        🎬 {JAM_CONFIG.name_ar} {JAM_CONFIG.edition}
      </Heading>
      <Bilingual ar="انطلقت الزنقة! الثيم هو:" en="The jam is live! The theme is:" />
      <Text
        style={{
          fontSize: 32,
          fontWeight: 800,
          textAlign: "center" as const,
          margin: "16px 0",
          background: "linear-gradient(135deg, #b347ff, #ff5e3a)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {themeAr}
      </Text>
      {themeEn && (
        <Text style={{ textAlign: "center", color: "#9a9ab0", margin: "0 0 16px" }}>
          {themeEn}
        </Text>
      )}
      <Bilingual
        ar="حظاً موفقاً! انضم لـ Discord للتعاون مع المجتمع، وارفع لعبتك على itch.io قبل انتهاء الـ٧٢ ساعة."
        en="Good luck! Join Discord to collab with the community, and submit your game on itch.io before the 72 hours run out."
      />
    </EmailShell>
  );
}

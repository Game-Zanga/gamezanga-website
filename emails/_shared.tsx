import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { JAM_CONFIG } from "@/lib/jam-config";

const colors = {
  bg: "#0a0a0f",
  surface: "#181826",
  border: "#2a2a45",
  fg: "#f5f5f7",
  muted: "#9a9ab0",
  accent: "#b347ff",
  accent2: "#ff5e3a",
};

export function EmailShell({
  preview,
  children,
}: {
  preview: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: colors.bg,
          color: colors.fg,
          fontFamily: "Tahoma, Arial, sans-serif",
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: 560,
            margin: "0 auto",
            padding: "32px 24px",
          }}
        >
          <Section style={{ textAlign: "center", marginBottom: 24 }}>
            <Heading
              as="h1"
              style={{
                fontSize: 28,
                margin: 0,
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent2})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {JAM_CONFIG.name_ar} · {JAM_CONFIG.name_en}
            </Heading>
            <Text style={{ color: colors.muted, fontSize: 13, margin: "4px 0 0" }}>
              {JAM_CONFIG.tagline_ar} — Edition {JAM_CONFIG.edition}
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: 24,
            }}
          >
            {children}
          </Section>

          <Hr style={{ borderColor: colors.border, margin: "24px 0" }} />
          <Section style={{ textAlign: "center" }}>
            <Text style={{ color: colors.muted, fontSize: 12, margin: 0 }}>
              <Link href={JAM_CONFIG.discord_url} style={{ color: colors.accent }}>
                Discord
              </Link>
              {"  ·  "}
              <Link href={JAM_CONFIG.itchio_url} style={{ color: colors.accent }}>
                itch.io
              </Link>
              {"  ·  "}
              <Link href={JAM_CONFIG.twitter_url} style={{ color: colors.accent }}>
                Twitter
              </Link>
            </Text>
            <Text style={{ color: colors.muted, fontSize: 11, margin: "8px 0 0" }}>
              {JAM_CONFIG.name_en} — لإلغاء الاشتراك راسلنا. To unsubscribe, reply to this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const Bilingual = ({ ar, en }: { ar: string; en: string }) => (
  <>
    <Text style={{ color: colors.fg, fontSize: 15, margin: "0 0 6px", direction: "rtl", textAlign: "right" }}>
      {ar}
    </Text>
    <Text style={{ color: colors.muted, fontSize: 14, margin: "0 0 16px" }}>{en}</Text>
  </>
);

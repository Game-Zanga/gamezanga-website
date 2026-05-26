import { Heading } from "@react-email/components";
import { Bilingual, EmailShell } from "./_shared";

export default function VotingWindowOpen({ siteUrl }: { siteUrl: string }) {
  return (
    <EmailShell preview="فتح التصويت على الثيم / Theme voting is open">
      <Heading as="h2" style={{ fontSize: 22, margin: "0 0 16px", color: "#f5f5f7" }}>
        🗳️
      </Heading>
      <Bilingual
        ar="تم اختيار الثيمات النهائية وفُتح باب التصويت. لكل مشارك صوت واحد."
        en="The finalist themes are out and voting is now open. One vote per participant."
      />
      <Bilingual
        ar={`صوّت الآن: ${siteUrl}/vote`}
        en={`Vote now: ${siteUrl}/vote`}
      />
    </EmailShell>
  );
}

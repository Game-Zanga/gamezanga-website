import { Heading } from "@react-email/components";
import { JAM_CONFIG } from "@/lib/jam-config";
import { Bilingual, EmailShell } from "./_shared";

export default function SuggestionWindowOpen({ siteUrl }: { siteUrl: string }) {
  return (
    <EmailShell preview="فتح اقتراح الثيمات / Theme suggestions are open">
      <Heading as="h2" style={{ fontSize: 22, margin: "0 0 16px", color: "#f5f5f7" }}>
        🎯
      </Heading>
      <Bilingual
        ar="فُتح باب اقتراح ثيمات الزنقة. اقترح حتى ٣ ثيمات."
        en="Theme suggestions are now open. You can submit up to 3 themes."
      />
      <Bilingual
        ar={`زر صفحة الاقتراحات: ${siteUrl}/suggest`}
        en={`Visit the suggestions page: ${siteUrl}/suggest`}
      />
      <Bilingual
        ar={`النسخة ${JAM_CONFIG.edition}`}
        en={`Edition ${JAM_CONFIG.edition}`}
      />
    </EmailShell>
  );
}

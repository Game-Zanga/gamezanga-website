import { Heading, Text } from "@react-email/components";
import { JAM_CONFIG } from "@/lib/jam-config";
import { Bilingual, EmailShell } from "./_shared";

export default function RegistrationConfirmation({
  fullName,
  edition = JAM_CONFIG.edition,
}: {
  fullName: string;
  /** Which edition they just signed up for — not always the current one. */
  edition?: number;
}) {
  return (
    <EmailShell preview={`تأكيد التسجيل في ${JAM_CONFIG.name_ar} ${edition}`}>
      <Heading as="h2" style={{ fontSize: 22, margin: "0 0 16px", color: "#f5f5f7" }}>
        أهلاً {fullName} 👾
      </Heading>
      <Bilingual
        ar={`تم تسجيلك بنجاح في ${JAM_CONFIG.name_ar} النسخة ${edition}.`}
        en={`You're registered for ${JAM_CONFIG.name_en} Edition ${edition}.`}
      />
      <Bilingual
        ar="سنرسل لك إشعارات عند فتح اقتراح الثيمات والتصويت، وعند انطلاق الزنقة."
        en="We'll notify you when theme suggestions open, when voting opens, and at jam start."
      />
      <Bilingual
        ar="انضم لمجتمعنا على Discord للبقاء على اطلاع."
        en="Join our Discord to stay in the loop."
      />
      <Text style={{ color: "#9a9ab0", fontSize: 12, marginTop: 16 }}>
        {`Edition ${edition} · ${JAM_CONFIG.tagline_en}`}
      </Text>
    </EmailShell>
  );
}

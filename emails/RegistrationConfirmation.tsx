import { Heading, Text } from "@react-email/components";
import { JAM_CONFIG } from "@/lib/jam-config";
import { Bilingual, EmailShell } from "./_shared";

export default function RegistrationConfirmation({ fullName }: { fullName: string }) {
  return (
    <EmailShell preview={`تأكيد التسجيل في ${JAM_CONFIG.name_ar} ${JAM_CONFIG.edition}`}>
      <Heading as="h2" style={{ fontSize: 22, margin: "0 0 16px", color: "#f5f5f7" }}>
        أهلاً {fullName} 👾
      </Heading>
      <Bilingual
        ar={`تم تسجيلك بنجاح في ${JAM_CONFIG.name_ar} النسخة ${JAM_CONFIG.edition}.`}
        en={`You're registered for ${JAM_CONFIG.name_en} Edition ${JAM_CONFIG.edition}.`}
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
        {`Edition ${JAM_CONFIG.edition} · ${JAM_CONFIG.tagline_en}`}
      </Text>
    </EmailShell>
  );
}

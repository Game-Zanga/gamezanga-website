import { Heading } from "@react-email/components";
import { Bilingual, EmailShell } from "./_shared";

export default function JamReminder({ hoursLeft }: { hoursLeft: number }) {
  return (
    <EmailShell preview={`متبقي ${hoursLeft} ساعة / ${hoursLeft} hours left`}>
      <Heading as="h2" style={{ fontSize: 22, margin: "0 0 16px", color: "#f5f5f7" }}>
        ⏰
      </Heading>
      <Bilingual
        ar={`تنبيه: متبقي تقريباً ${hoursLeft} ساعة على إغلاق التسليم. تأكد من رفع لعبتك على itch.io.`}
        en={`Heads up: about ${hoursLeft} hours left until the submission window closes. Make sure your game is up on itch.io.`}
      />
    </EmailShell>
  );
}

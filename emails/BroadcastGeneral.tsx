import { Bilingual, EmailShell } from "./_shared";

export default function BroadcastGeneral({
  bodyAr,
  bodyEn,
}: {
  bodyAr: string;
  bodyEn?: string;
}) {
  return (
    <EmailShell preview={bodyAr.slice(0, 80)}>
      <Bilingual ar={bodyAr} en={bodyEn || ""} />
    </EmailShell>
  );
}
